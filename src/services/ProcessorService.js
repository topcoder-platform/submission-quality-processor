/**
 * Service for Kafka processor
 */

const config = require('config')
const joi = require('joi')
const logger = require('../common/logger')
const helper = require('../common/helper')
const SonarService = require('./SonarService')

/**
 * Analyze the files specified in URL field in Payload
 * @param {Object} message the Kafka message in JSON format
 * @returns {Promise}
 */
const analyze = async (message) => {
  const submissionApiClient = helper.getSubmissionApiWrapperClient()
  const avScanTypeId = await helper.getreviewTypeId('AV SCAN')
  // Process only AV Scan Reviews
  if (message.payload.typeId !== avScanTypeId) {
    logger.debug(`Ignoring Non AV Scan reviews from topic ${message.topic}`)
    return false
  }

  const submission = await submissionApiClient.getSubmission(message.payload.submissionId)

  await helper.downloadFile(submission.body.id, `${config.DOWNLOAD_DIR}/${submission.body.id}`)

  logger.info(`Running sonar scan for Submission # ${submission.id}`)
  await SonarService.runSonarAnalysis(submission.id, `${config.DOWNLOAD_DIR}/${submission.id}`)
  return true
}

analyze.schema = {
  message: joi.object().keys({
    topic: joi.string().required(),
    originator: joi.string().required(),
    timestamp: joi.date().required(),
    'mime-type': joi.string().required(),
    payload: joi.object().required()
  }).required()
}

module.exports = {
  analyze
}

logger.buildService(module.exports)
