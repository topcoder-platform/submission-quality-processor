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

module.exports = {
  createMessage
}
