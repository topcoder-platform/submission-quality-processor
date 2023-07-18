/**
 * Contains generic helper methods
 */

const config = require('config')
const _ = require('lodash')
const fs = require('fs-extra')
const unzip = require('unzipper')
const submissionApi = require('@topcoder-platform/topcoder-submission-api-wrapper')
const Duplex = require('stream').Duplex

// Variable to cache reviewTypes from Submission API
const reviewTypes = {}

// Submission API Wrapper client
let submissionApiClient

/**
 * Function to download submission by id
 * @param {String} submissionId The id of the submission to download
 * @param {String} unzipPath Path to which the downloaded contents need to be extracted
 * @returns {Promise}
 */
const downloadFile = async (submissionId, unzipPath) => {
  const submissionApiWrapper = getSubmissionApiWrapperClient()
  const res = await submissionApiWrapper.downloadSubmission(submissionId)
  fs.removeSync(`${unzipPath}`)
  if (res.headers['content-type'] === 'application/zip') {
    let stream = new Duplex()
    stream.push(res.body)
    stream.push(null)
    await stream.pipe(unzip.Extract({ path: `${unzipPath}` })).promise()
  } else {
    await fs.outputFile(`${unzipPath}/${submissionId}`, res.body, 'binary')
  }
}

/*
 * Function to get reviewTypeId from Name
 * @param {String} reviewTypeName Name of the reviewType
 * @returns {String} reviewTypeId
 */
const getreviewTypeId = async (reviewTypeName) => {
  if (!reviewTypes[reviewTypeName]) {
    // Get review type id from Submission API
    const submissionApiWrapper = getSubmissionApiWrapperClient()
    const response = await submissionApiWrapper.searchReviewTypes({ name: reviewTypeName })
    if (response.body && response.body.length !== 0) {
      reviewTypes[reviewTypeName] = response.body[0].id
    } else {
      reviewTypes[reviewTypeName] = null
    }
  }
  return reviewTypes[reviewTypeName]
}

/**
 * Returns the submission api wrapper client
 */
function getSubmissionApiWrapperClient () {
  if (submissionApiClient) {
    return submissionApiClient
  }

  submissionApiClient = submissionApi(_.pick(
    config,
    [
      'AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME',
      'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'SUBMISSION_API_URL',
      'AUTH0_PROXY_SERVER_URL'
    ]
  ))

  return submissionApiClient
}

module.exports = {
  downloadFile,
  getreviewTypeId,
  getSubmissionApiWrapperClient
}
