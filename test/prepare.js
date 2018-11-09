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
const reviewTypesUrl = URL.parse(`${config.SUBMISSION_API_URL}/reviewTypes?name=AV%20SCAN`)

const AV_SCAN_TYPE = [
  {
    name: 'AV Scan',
    id: '68c5a381-c8ab-48af-92a7-7a869a4ee6c3',
    isActive: true
  }
]

nock(/\//)
  .persist()
  .post(authUrl.path)
  .reply(200, { access_token: 'test' })
  .post(subApiUrl.path)
  .reply(200)
  .get(reviewTypesUrl.path)
  .reply(200, AV_SCAN_TYPE)
