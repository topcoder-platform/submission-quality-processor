/*
 * Setting up Mock for all tests
 */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

require('../src/bootstrap')
const config = require('config')
const fs = require('fs')
const path = require('path')
const nock = require('nock')
const URL = require('url')
const testData = require('./testData')

const authUrl = URL.parse(config.AUTH0_URL)
const reviewTypesUrl = URL.parse(`${config.SUBMISSION_API_URL}/reviewTypes?name=AV%20SCAN&`)
const downloadSubmissionUrl = URL.parse(`${config.SUBMISSION_API_URL}/submissions/${testData.createMessage.payload.submissionId}/download`)

const AV_SCAN_TYPE = [
  {
    name: 'AV Scan',
    id: '68c5a381-c8ab-48af-92a7-7a869a4ee6c3',
    isActive: true
  }
]

const testFileContent = fs.readFileSync(path.join(__dirname, './testFile.zip'))

nock(/\//)
  .persist()
  .post(authUrl.path)
  .reply(200, { access_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik5VSkZORGd4UlRVME5EWTBOVVkzTlRkR05qTXlRamxETmpOQk5UYzVRVUV3UlRFeU56TTJRUSJ9.eyJpc3MiOiJodHRwczovL3RvcGNvZGVyLWRldi5hdXRoMC5jb20vIiwic3ViIjoiRWtFOXFVM0V5NmhkSndPc0YxWDBkdXdza3FjRHVFbFdAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vbTJtLnRvcGNvZGVyLWRldi5jb20vIiwiaWF0IjoxNTY2MzY0MDk0LCJleHAiOjE1NjY0NTA0OTQsImF6cCI6IkVrRTlxVTNFeTZoZEp3T3NGMVgwZHV3c2txY0R1RWxXIiwic2NvcGUiOiJyZWFkOmNoYWxsZW5nZXMgcmVhZDpncm91cHMgcmVhZDpzdWJtaXNzaW9uIHJlYWQ6cmV2aWV3X3R5cGUgcmVhZDpyZXZpZXdfc3VtbWF0aW9uIHJlYWQ6cmV2aWV3IHJlYWQ6cHJvamVjdCByZWFkOmJ1c190b3BpY3Mgd3JpdGU6YnVzX2FwaSByZWFkOmVtYWlsX3RlbXBsYXRlcyByZWFkOnVzZXJfcHJvZmlsZXMgcmVhZDpyb2xlcyByZWFkOnJlc291cmNlcyB3cml0ZTpyZXNvdXJjZXMgZGVsZXRlOnJlc291cmNlcyB1cGRhdGU6cmVzb3VyY2VzIGFsbDpyZXNvdXJjZXMiLCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMifQ.Kh4fBil_OZQdAS1XZU34uoSqR2ibD91Ijx_1_Hw7rtrVVwnRvQXOgPJRvUuwHIc-TZMSif8H6EpR21scbpACZCMzFixXND5gFVZTcoyv6V3jMYQfV2DEBIskXnQUf76GVNfNzlvSoNeCUdT83jIV4qPIT03LhFONq0krnz--nTC0Ff0Zu_T8Ah84Blmi7l3W4pGkYhsZO10mOLPYlEODiB_3a9bsUwfRrfDSbv9W1qngH6I4e-6kL5YnRaFW3wA9nv_-mzfiztY0i12xPG5LvpaltWULolbJ52u7fgHfssAIHGObhPHMuTJ6L9luTeOAE7ou0EOdulc4ffnXHakzvA' })
  .get(reviewTypesUrl.path)
  .reply(200, AV_SCAN_TYPE)
  .get(downloadSubmissionUrl.path)
  .reply(200, testFileContent, {
    'Content-Length': (req, res, body) => body.length,
    'Content-Type': 'application/zip',
    ETag: () => `${Date.now()}`
  })
