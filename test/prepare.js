/*
 * Setting up Mock for all tests
 */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

require('../src/bootstrap')
const config = require('config')
const nock = require('nock')
const URL = require('url')
const AWS = require('aws-sdk-mock')

// Mock AWS S3 and External API interactions
AWS.mock('S3', 'getObject', Buffer.from(require('fs').readFileSync(`${__dirname}/testFile.zip`)))

const authUrl = URL.parse(config.AUTH0_URL)
const subApiUrl = URL.parse(`${config.SUBMISSION_API_URL}/reviews`)

nock(/\//)
  .persist()
  .post(authUrl.path)
  .reply(200, { access_token: 'test' })
  .post(subApiUrl.path)
  .reply(200)
