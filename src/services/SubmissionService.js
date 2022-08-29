/**
 * Service to communicate with topcoder submission api
 */
const joi = require('joi')
const JSZip = require('jszip')
const config = require('config')
const logger = require('../common/logger')
const { getSubmissionApiWrapperClient } = require('../common/helper')

const REVIEW_TYPE_NAME = config.REVIEW_TYPE_NAME

/**
 * Update submission status
 * @param {Object} payload Status
 * @returns {Promise}
 */
async function createReview (payload) {
  const client = getSubmissionApiWrapperClient()
  const res = await client.searchReviewTypes({ name: REVIEW_TYPE_NAME, isActive: true })
  if (res.body.length === 0) {
    throw new Error(`No review type found for ${REVIEW_TYPE_NAME}`)
  }
  const typeId = res.body[0].id
  return client.createReview({
    ...payload,
    typeId
  })
}

createReview.schema = joi.object().keys({
  payload: joi.object().keys({
    score: joi.number().required(),
    reviewerId: joi.string().required(),
    submissionId: joi.string().required(),
    scoreCardId: joi.number().integer().min(1),
    metadata: joi.object().optional()
  }).required()
})
/**
 * Upload submission artifacts
 * @param {String} submissionId The submission id to upload the artifact to
 * @param {String} filename Artifact filename
 * @param {Object} body Artifacts content
 * @returns {Promise}
 */
async function uploadArtifacts (submissionId, filename, body) {
  const zip = new JSZip()
  zip.file(`${filename}.json`, JSON.stringify(body, null, 2))
  const content = await zip.generateAsync({ type: 'nodebuffer' })
  const artifactPayload = {
    artifact: {
      name: `${filename}.zip`,
      data: content
    }
  }

  const client = getSubmissionApiWrapperClient()
  return client.createArtifact(submissionId, artifactPayload)
}

uploadArtifacts.schema = joi.object().keys({
  submissionId: joi.string().required(),
  filename: joi.string().required(),
  body: joi.object().required()
})

module.exports = {
  createReview,
  uploadArtifacts
}

logger.buildService(module.exports)
