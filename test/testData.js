/*
 * Test Data
 */

const createMessage = {
  topic: 'submission.notification.create',
  originator: 'submission-api',
  timestamp: '2018-02-03T00:00:00',
  'mime-type': 'application/json',
  payload: {
    resource: 'submission',
    id: 'd24d4180-65aa-42ec-a945-5fd21dec0516',
    url: 'https://s3.amazonaws.com/tc-clean/testFile.zip'
  }
}

const testWebHook = {
  serverUrl: 'http://localhost:9000',
  taskId: 'AWaIkO3UJnZ4bDlnlrak',
  status: 'SUCCESS',
  project: {
    key: 'a34e1158-2c27-4d38-b079-5e5cca1bdcf7',
    name: 'a34e1158-2c27-4d38-b079-5e5cca1bdcf7'
  },
  branch: {
    name: 'master',
    type: 'LONG',
    isMain: true
  },
  qualityGate: {
    name: 'SonarQube way',
    status: 'OK'
  },
  properties: {

  }
}

module.exports = {
  createMessage,
  testWebHook
}
