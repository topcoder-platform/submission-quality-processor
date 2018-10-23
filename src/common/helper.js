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

/**
 * Wrap async function to standard express function
 * @param {Function} fn the async function
 * @returns {Function} the wrapped function
 */
const wrapExpress = fn => (req, res, next) => {
  fn(req, res, next).catch(next)
}

/**
 * Wrap all functions from object
 * @param obj the object (controller exports)
 * @returns {Object|Array} the wrapped object
 */
const autoWrapExpress = (obj) => {
  if (_.isArray(obj)) {
    return obj.map(autoWrapExpress)
  }
  if (_.isFunction(obj)) {
    if (obj.constructor.name === 'AsyncFunction') {
      return wrapExpress(obj)
    }
    return obj
  }
  _.each(obj, (value, key) => {
    obj[key] = autoWrapExpress(value)
  })
  return obj
}

/*
 * Function to get M2M token
 * @returns {Promise}
 */
const getM2Mtoken = async () => {
  return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

/*
 * POST the review payload to Submission API
 * @param {Object} body Request body
 * @returns {Promise}
 */
const postReview = async (body) => {
  const token = await getM2Mtoken()
  return request
    .post(`${config.SUBMISSION_API_URL}/reviews`)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json')
    .send(body)
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

module.exports = {
  wrapExpress,
  autoWrapExpress,
  postReview,
  downloadFile
}
