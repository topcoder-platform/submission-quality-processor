/**
 * Service to analyze files using Sonar Scanner CLI
 */

const joi = require('joi')
const config = require('config')
const exec = Promise.promisify(require('child_process').exec)
const request = require('superagent')
const _ = require('lodash')
const uuid = require('uuid/v4')
const logger = require('../common/logger')
const { createReview, uploadArtifacts } = require('./SubmissionService')
const MAXIMUM_SCORE_CARD_ID = 200000000 // the maximum value of dummy score card id

/**
 * Run Sonar Analysis in the given directory
 * @param {String} submissionId Submission ID
 * @param {String} scanDir Absolute path to directory in which Scan will happen
 * @returns {Promise}
 */
const runSonarAnalysis = async (submissionId, scanDir) => {
  logger.info(`Starting sonar scan for Submission # ${submissionId}`)
  exec(
    `sonar-scanner -Dsonar.projectKey=${submissionId} \
      -Dsonar.sources=${scanDir} \
      -Dsonar.projectBaseDir=${scanDir} \
      -Dsonar.host.url=${config.SONARQUBE_SERVER_URL} \
      -Dsonar.login=${config.SONARQUBE_TOKEN} \
      -Dsonar.scm.exclusions.disabled=true \
      -Dsonar.qualitygate.wait=true \
      -Dsonar.qualitygate.timeout=${config.SONARQUBE_QUALITYGATE_TIMEOUT}`
  ).catch(() => {}) // when quality gate fails metric thresholds, it throws an exception, nothing to do here.
    .finally(async () => {
      logger.info(`Sonar scan complete for Submission # ${submissionId}`)
      const response = await fetch(`/api/qualitygates/project_status`, {
        projectKey: submissionId
      })
      await processScanResults(response, submissionId)
    })
}
runSonarAnalysis.schema = {
  submissionId: joi.string().guid().required(),
  scanDir: joi.string().required()
}

/**
 * Process the scan results from Sonarqube Server
 * @param {Object} body quality gate status body
 * @param {String} submission id
 * @returns {Promise}
 */
async function processScanResults (body, submissionId) {
  const randomNumber = Math.floor(Math.random() * MAXIMUM_SCORE_CARD_ID) + 1

  const scanResults = await getScanResults(submissionId, new Date().toISOString())
  const qualityGatePassed = _.get(body, 'projectStatus.status') === 'OK'

  let payload = {
    //score: qualityGatePassed ? 100 : 0,
    //Note that, for data gathering, we are temporarily going to pass *all* submissions
    score:100,
    reviewerId: uuid(),
    submissionId,
    scoreCardId: randomNumber
  }

  if (!qualityGatePassed) {
    payload = {
      ...payload,
      metadata: {
        sonarQubeScan: scanResults
      }
    }
  }

  const { body: reviewRsp } = await createReview(payload)
  logger.info(`Created review with id ${reviewRsp.id} and score:${reviewRsp.score}`)

  await uploadArtifacts(submissionId, 'SonarQubeSummary', body)

  await uploadArtifacts(submissionId, 'SonarQubeDetails', scanResults)

  logger.debug('Uploading artifacts complete')
}

processScanResults.schema = {
  body: joi.object().required(),
  submissionId: joi.string().required()
}

// List of issue types that metrics and details must be collected for
const ISSUE_TYPES = ['code_smells', 'bugs', 'security_hotspots', 'vulnerabilities']

// SonarQube response validation schemas
const PAGING_SCHEMA = joi.object().keys({
  paging: joi.object().keys({
    pageIndex: joi.number().required(),
    pageSize: joi.number().required(),
    total: joi.number().required()
  }).required()
}).unknown(true).required()

const MEASURES_SCHEMA = joi.object().keys({
  measures: joi.array().items(joi.object().keys({
    metric: joi.string().required(),
    history: joi.array().items(joi.object().keys({
      value: joi.number().required()
    }).unknown(true).required())
  })).required()
}).unknown(true).required()

const ISSUES_SCHEMA = joi.object().keys({
  issues: joi.array().items(joi.object().keys({
    type: joi.string().required()
  }).unknown(true)).required()
}).unknown(true).required()

// Configuration
const SONARQUBE_TOKEN = config.has('SONARQUBE_TOKEN') ? config.get('SONARQUBE_TOKEN') : undefined

/**
 * Send GET request to SonarQube's endpoint
 * @param {String} endpoint Endpoint to request
 * @param {Object} query List of GET parameters
 *
 * @returns {Promise} Resolves to response body
 */
async function fetch (endpoint, query) {
  const url = `${config.SONARQUBE_SERVER_URL}${endpoint}`
  logger.debug(`Sending GET request to ${url} ${query}`)

  const { body } = await request
    .get(url)
    .use((req) => {
      // add authorization header when token is configured
      if (SONARQUBE_TOKEN) {
        req.auth(SONARQUBE_TOKEN)
      }
    })
    .query(query)

  return body
}

/**
 * Sends GET request to SonarQube's endpoint.
 * Returns generator to iterate over each page
 * @param {String} endpoint Endpoint to request
 * @param {Object} query List of GET parameters
 *
 * @returns {Generator}
 */
async function * fetchPaginated (endpoint, query) {
  let currentPage = 1
  let totalPages = 1

  while (currentPage <= totalPages) {
    const resp = await fetch(endpoint, { ...query, p: currentPage })

    if (totalPages === 1) {
      // Verify that response contains paging info and calculate total pages
      await PAGING_SCHEMA.validate(resp)
      totalPages = Math.ceil(resp.paging.total / resp.paging.pageSize)
    }

    yield resp
    currentPage++
  }
}

/**
 * Get project measures
 * @param {String} projectKey Project key
 *
 * @returns {Promise} Resolves to object that contains specified measures
 */
async function getProjectMeasures (projectKey) {
  // No need for paginated fetch as metrics response fits into single page
  const body = await fetch('/api/measures/search_history', {
    component: projectKey,
    metrics: ISSUE_TYPES.join(','),
    pageSize: 100
  })

  await MEASURES_SCHEMA.validate(body)

  const r = {}

  // collect specified metrics
  for (const measure of body.measures) {
    if (!ISSUE_TYPES.includes(measure.metric)) {
      continue
    }

    // get the latest historical value
    r[measure.metric] = Number(_.last(measure.history).value)
  }

  // check that all required metrics found
  const missingKeys = _.xor(_.keys(r), ISSUE_TYPES)
  if (!_.isEmpty(missingKeys)) {
    throw new Error(`Metrics "${missingKeys}" missing in SQ response`)
  }

  return r
}

/**
 * Get project issues
 * @param {String} projectKey Project key
 *
 * @returns {Promise} Resolves to object that contains details of specified issues
 */
async function getProjectIssues (projectKey) {
  // create response object with empty array properties
  const r = _.zipObject(ISSUE_TYPES, _.map(ISSUE_TYPES, () => []))

  for await (const body of fetchPaginated('/api/issues/search', {
    componentKeys: projectKey,
    pageSize: 100
  })) {
    await ISSUES_SCHEMA.validate(body)

    for (const issue of body.issues) {
      const key = _.find(ISSUE_TYPES, (type) => {
        // special case for 'vulnerabilities'
        if (type.endsWith('ies')) {
          return type.replace(new RegExp('ies$'), 'y').startsWith(issue.type.toLowerCase())
        }

        return type.startsWith(issue.type.toLowerCase())
      })

      if (key) {
        r[key].push(issue)
      }
    }
  }

  return r
}

/**
 * Get issues and measures from SonarQube web api
 * @param {String} projectKey ProjectKey
 * @param {String} analysedAt Datetime when the project has been analysed
 *
 * @returns {Promise} Resolves to object that contains measures and issues details
 */
async function getScanResults (projectKey, analysedAt) {
  const [measures, issues] = await Promise.all([
    getProjectMeasures(projectKey),
    getProjectIssues(projectKey)
  ])

  return {
    project_key: projectKey,
    scan_time: analysedAt,
    measures,
    issues
  }
}

getScanResults.schema = joi.object().keys({
  projectKey: joi.string().required(),
  analysedAt: joi.string().required()
}).required()

module.exports = {
  runSonarAnalysis
}
