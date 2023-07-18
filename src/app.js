/**
 * The application entry point
 */

require('./bootstrap')
require('dotenv').config()

const config = require('config')
const _ = require('lodash')
const logger = require('./common/logger')
const Kafka = require('no-kafka')
const ProcessorService = require('./services/ProcessorService')
const healthcheck = require('topcoder-healthcheck-dropin')

// start Kafka consumer
logger.info('Start Kafka consumer.')
// create consumer
const options = { connectionString: config.KAFKA_URL }
if (config.KAFKA_CLIENT_CERT && config.KAFKA_CLIENT_CERT_KEY) {
  options.ssl = { cert: config.KAFKA_CLIENT_CERT, key: config.KAFKA_CLIENT_CERT_KEY }
}
const consumer = new Kafka.SimpleConsumer(options)

// data handler
const dataHandler = (messageSet, topic, partition) => Promise.each(messageSet, (m) => {
  const message = m.message.value.toString('utf8')
  logger.info(`Handle Kafka event message; Topic: ${topic}; Partition: ${partition}; Offset: ${
    m.offset}; Message: ${message}.`)
  let messageJSON
  try {
    messageJSON = JSON.parse(message)
  } catch (e) {
    logger.error('Invalid message JSON.')
    logger.logFullError(e)
    // ignore the message
    return
  }

  if (messageJSON.topic !== topic) {
    logger.error(`The message topic ${messageJSON.topic} doesn't match the Kafka topic ${topic}.`)
    // ignore the message
    return
  }

  if (messageJSON.payload.resource !== 'review') {
    logger.debug(`Ignoring Non review payloads from topic ${messageJSON.topic}.`)
    // ignore the message
    return
  }

  return (async () => {
    await ProcessorService.analyze(messageJSON)
  })()
    // commit offset
    .then(() => consumer.commitOffset({ topic, partition, offset: m.offset }))
    .catch((err) => logger.logFullError(err))
})

// check if there is kafka connection alive
function check () {
  if (!consumer.client.initialBrokers && !consumer.client.initialBrokers.length) {
    return false
  }
  let connected = true
  consumer.client.initialBrokers.forEach(conn => {
    logger.debug(`url ${conn.server()} - connected=${conn.connected}`)
    connected = conn.connected & connected
  })
  return connected
}

consumer
  .init()
  // consume configured topics
  .then(() => {
    healthcheck.init([check])
    const topics = [config.CREATE_DATA_TOPIC, config.UPDATE_DATA_TOPIC]
    _.each(topics, (tp) => {
      consumer.subscribe(tp, { time: Kafka.LATEST_OFFSET }, dataHandler)
    })
  })
  .catch((err) => logger.logFullError(err))
