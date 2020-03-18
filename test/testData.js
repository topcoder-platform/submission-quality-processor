/*
 * Test Data
 */

const createMessage = {
  topic: 'submission.notification.create',
  originator: 'submission-api',
  timestamp: '2018-02-03T00:00:00',
  'mime-type': 'application/json',
  payload: {
    resource: 'review',
    submissionId: '2561b61b-7f73-48a3-8a01-0891ad503c52',
    typeId: '68c5a381-c8ab-48af-92a7-7a869a4ee6c3'
  }
}

module.exports = {
  createMessage
}
