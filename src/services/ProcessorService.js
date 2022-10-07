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
  const avScanTypeId = await helper.getreviewTypeId(config.AV_SCAN_NAME)
  // Process only AV Scan Reviews
  if (message.payload.typeId !== "2929bc33-8f58-4011-8e49-9e3a10499e97") {
    logger.debug(`Ignoring Non AV Scan reviews from topic ${message.topic}`)
    return false
  }

  const submissionId = message.payload.submissionId
  await helper.downloadFile(submissionId, `${config.DOWNLOAD_DIR}/${submissionId}`)

  await SonarService.runSonarAnalysis(submissionId, `${config.DOWNLOAD_DIR}/${submissionId}`)
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
