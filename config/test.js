/**
 * Configuration file to be used while running tests
 */

module.exports = {
  SONARQUBE_SERVER_URL: process.env.TEST_SONARQUBE_SERVER_URL || 'http://localhost:9000',
  SONARQUBE_TOKEN: process.env.TEST_SONARQUBE_TOKEN,
  AUTH0_URL: 'http://test' // Since we use Nock, just dummy value stored
}
