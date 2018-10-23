/**
 * Test cases for Processor service
 */

const chai = require('chai')
const service = require('../src/services/ProcessorService')
const testData = require('./testData')

chai.should()
chai.use(require('chai-as-promised'))

describe('Processor Service Tests', () => {
  it('Processor Service - null message', async () => {
    return service.analyze(null).should.be.rejectedWith('"message" must be an object')
  })

  it('Processor Service - invalid message (missing topic)', async () => {
    const testMessage = {
      originator: 'originator',
      timestamp: '2018-01-02T00:00:00',
      'mime-type': 'application/json',
      payload: { abc: 123 }
    }
    return service.analyze(testMessage).should.be.rejectedWith('"topic" is required')
  })

  it('Processor Service - invalid message (empty topic)', async () => {
    const testMessage = {
      topic: '',
      originator: 'originator',
      timestamp: '2018-01-02T00:00:00',
      'mime-type': 'application/json',
      payload: { abc: 123 }
    }
    return service.analyze(testMessage).should.be.rejectedWith('"topic" is not allowed to be empty')
  })

  it('Processor Service - invalid message (missing originator)', async () => {
    const testMessage = {
      topic: 'test',
      timestamp: '2018-01-02T00:00:00',
      'mime-type': 'application/json',
      payload: { abc: 123 }
    }
    return service.analyze(testMessage).should.be.rejectedWith('"originator" is required')
  })

  it('Processor Service - invalid message (missing timestamp)', async () => {
    const testMessage = {
      topic: 'test',
      originator: 'originator',
      'mime-type': 'application/json',
      payload: { abc: 123 }
    }
    return service.analyze(testMessage).should.be.rejectedWith('"timestamp" is required')
  })

  it('Processor Service - invalid message (missing mime-type)', async () => {
    const testMessage = {
      topic: 'test',
      originator: 'originator',
      timestamp: '2018-01-02T00:00:00',
      payload: { abc: 123 }
    }
    return service.analyze(testMessage).should.be.rejectedWith('"mime-type" is required')
  })

  it('Processor Service - invalid message (null payload)', async () => {
    const testMessage = {
      topic: 'test',
      originator: 'originator',
      timestamp: '2018-01-02T00:00:00',
      'mime-type': 'application/json',
      payload: null
    }
    return service.analyze(testMessage).should.be.rejectedWith('"payload" must be an object')
  })

  it('Processor Service - Valid create message should be handled successfully', async () => {
    return service.analyze(testData.createMessage).should.be.fulfilled
  }).timeout(30000)
})
