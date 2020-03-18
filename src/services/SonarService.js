/**
 * Service to analyze files using Sonar Scanner CLI
 */

const joi = require('joi')
const config = require('config')
const exec = Promise.promisify(require('child_process').exec)

/**
 * Run Sonar Analysis in the given directory
 * @param {String} submissionId Submission ID
 * @param {String} scanDir Absolute path to directory in which Scan will happen
 * @returns {Promise}
 */
const runSonarAnalysis = async (submissionId, scanDir) => {
  await exec(
    `sonar-scanner -Dsonar.projectKey=${submissionId} \
      -Dsonar.sources=${scanDir} \
      -Dsonar.host.url=${config.SONARQUBE_SERVER_URL} \
      -Dsonar.login=${config.SONARQUBE_TOKEN}`
    // -Dsonar.organization=${config.SONARQUBE_ORGANIZATION}`
  )
}

runSonarAnalysis.schema = {
  submissionId: joi.string().guid().required(),
  scanDir: joi.string().required()
}

module.exports = {
  runSonarAnalysis
}
