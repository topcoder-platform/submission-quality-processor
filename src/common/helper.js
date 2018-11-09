/**
 * Contains generic helper methods
 */

const config = require('config')
const _ = require('lodash')
const request = require('superagent')
const AWS = require('aws-sdk')
const AmazonS3URI = require('amazon-s3-uri')
const fs = require('fs-extra')
const path = require('path')
const logger = require('./logger')
const unzip = require('unzipper')

const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME']))

AWS.config.region = config.REGION
const s3 = new AWS.S3()

// Variable to cache reviewTypes from Submission API
const reviewTypes = {}

/*
 * Function to get M2M token
 * @returns {Promise}
 */
const getM2Mtoken = async () => {
  return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

/**
 * Function to download file from given URL
 * @param {String} fileURL URL of the file to be downloaded
 * @param {String} unzipPath Path to which the downloaded contents need to be extracted
 * @returns {Promise}
 */
const downloadFile = async (fileURL, unzipPath) => {
  const { bucket, key } = AmazonS3URI(fileURL)
  logger.info(`downloadFile(): file is on S3 ${bucket} / ${key}`)
  const fileExt = path.extname(key)
  // If it's a zip file, unzip the file else just copy the contents
  if (fileExt.toLowerCase() === '.zip') {
    const zipFile = s3.getObject({ Bucket: bucket, Key: key }).createReadStream()
    await zipFile.pipe(unzip.Extract({ path: `${unzipPath}` })).promise()
  } else {
    const nonZipFile = await s3.getObject({ Bucket: bucket, Key: key }).promise()
    await fs.outputFile(`${unzipPath}/${key}`, nonZipFile.Body, 'binary')
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
    const response = await reqToSubmissionAPI('GET',
      `${config.SUBMISSION_API_URL}/reviewTypes?name=${reviewTypeName}`, {})
    if (response.length !== 0) {
      reviewTypes[reviewTypeName] = response[0].id
    } else {
      reviewTypes[reviewTypeName] = null
    }
  }
  return reviewTypes[reviewTypeName]
}

/**
 * Function to send request to Submission API
 * @param {String} reqType Type of the request POST / PATCH
 * @param (String) path Complete path of the Submission API URL
 * @param {Object} reqBody Body of the request
 * @returns {Promise}
 */
const reqToSubmissionAPI = async (reqType, path, reqBody) => {
  // Token necessary to send request to Submission API
  const token = await getM2Mtoken()

  if (reqType === 'POST') {
    // Post the request body to Submission API
    await request
      .post(path)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(reqBody)
  } else if (reqType === 'PUT') {
    // Put the request body to Submission API
    await request
      .put(path)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(reqBody)
  } else if (reqType === 'PATCH') {
    // Patch the request body to Submission API
    await request
      .post(path)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(reqBody)
  } else if (reqType === 'GET') {
    // GET the requested URL from Submission API
    const response = await request
      .get(path)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
    if (response.body) {
      return response.body
    } else {
      return null
    }
  }
}

module.exports = {
  downloadFile,
  getreviewTypeId,
  reqToSubmissionAPI
}
