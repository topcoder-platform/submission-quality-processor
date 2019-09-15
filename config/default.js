/**
 * The configuration file.
 */

const path = require('path')

module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3000,

  KAFKA_URL: process.env.KAFKA_URL || 'localhost:9092',
  // below two params are used for secure Kafka connection, they are optional
  // for the local Kafka, they are not needed
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY,

  // Kafka topics related to Creation, Update and Delete
  CREATE_DATA_TOPIC: process.env.CREATE_DATA_TOPIC || 'submission.notification.create',
  UPDATE_DATA_TOPIC: process.env.UPDATE_DATA_TOPIC || 'submission.notification.update',

  SUBMISSION_API_URL: process.env.SUBMISSION_API_URL || 'https://api.topcoder-dev.com/v5',
  SONARQUBE_SERVER_URL: process.env.SONARQUBE_SERVER_URL || 'http://localhost:9000',
  SONARQUBE_TOKEN: process.env.SONARQUBE_TOKEN,
  SONARQUBE_ORGANIZATION: process.env.SONARQUBE_ORGANIZATION,

  // Relative path for Output directory
  DOWNLOAD_DIR: path.resolve(__dirname, '..', process.env.DOWNLOAD_DIR || 'downloads'),

  AUTH0_URL: process.env.AUTH0_URL, // Auth0 credentials for Leaderboard Service
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL
}
