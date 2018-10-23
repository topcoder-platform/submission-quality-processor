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
  await helper.downloadFile(message.payload.url, `${config.DOWNLOAD_DIR}/${message.payload.id}`)
  logger.info(`Running sonar scan for Submission # ${message.payload.id}`)
  await SonarService.runSonarAnalysis(message.payload.id, `${config.DOWNLOAD_DIR}/${message.payload.id}`)
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
