/**
 * This file creates a new quality gate having metric
 * conditions that can be applied on the first
 * analysis of code itself. Also sets the created
 * quality gate as the default quality gate
 */
global.Promise = require('bluebird')

require('dotenv').config()
const request = require('superagent')
const config = require('config')

const QUALITY_GATE = config.QUALITY_GATE
const SONARQUBE_SERVER_URL = config.SONARQUBE_SERVER_URL
const SONARQUBE_TOKEN = config.SONARQUBE_TOKEN

const RATINGS = {
  A: 1
}

async function createQualityGate () {
  // check if quality gate already exists
  let existingQualityGate = true
  try {
    await request
      .get(`${SONARQUBE_SERVER_URL}/api/qualitygates/search`)
      .auth(SONARQUBE_TOKEN)
      .query({
        gateName: QUALITY_GATE
      })
  } catch (err) {
    if (err.status === 404) { existingQualityGate = false }
  }

  if (existingQualityGate) {
    console.log(`Quality gate with name ${QUALITY_GATE} already exists`)
    process.exit(1)
  }

  try {
    // create a new quality gate
    const { body } = await request
      .post(`${SONARQUBE_SERVER_URL}/api/qualitygates/create`)
      .query({ name: QUALITY_GATE })
      .auth(SONARQUBE_TOKEN)

    console.log('created quality gate', JSON.stringify(body))

    // add reliability rating worse than 'A' condition
    const condRsp1 = await request
      .post(`${SONARQUBE_SERVER_URL}/api/qualitygates/create_condition`)
      .auth(SONARQUBE_TOKEN)
      .query({ gateName: QUALITY_GATE,
        metric: 'reliability_rating',
        op: 'GT',
        error: RATINGS.A })
    console.log('created condition', JSON.stringify(condRsp1.body))

    // add maintainability rating worse than 'A' condition
    const condRsp2 = await request
      .post(`${SONARQUBE_SERVER_URL}/api/qualitygates/create_condition`)
      .auth(SONARQUBE_TOKEN)
      .query({ gateName: QUALITY_GATE,
        metric: 'sqale_rating',
        op: 'GT',
        error: RATINGS.A })
    console.log('created condition', JSON.stringify(condRsp2.body))

    // add security rating worse than 'A' condition
    const condRsp3 = await request
      .post(`${SONARQUBE_SERVER_URL}/api/qualitygates/create_condition`)
      .auth(SONARQUBE_TOKEN)
      .query({ gateName: QUALITY_GATE,
        metric: 'security_rating',
        op: 'GT',
        error: RATINGS.A })
    console.log('created condition', JSON.stringify(condRsp3.body))

    // add duplicated lines percentage > 3% condition
    const condRsp4 = await request
      .post(`${SONARQUBE_SERVER_URL}/api/qualitygates/create_condition`)
      .auth(SONARQUBE_TOKEN)
      .query({ gateName: QUALITY_GATE,
        metric: 'duplicated_lines_density',
        op: 'GT',
        error: 3 })
    console.log('created condition', JSON.stringify(condRsp4.body))

    // add security hotspots reviewed < 100% condition
    const condRsp5 = await request
      .post(`${SONARQUBE_SERVER_URL}/api/qualitygates/create_condition`)
      .auth(SONARQUBE_TOKEN)
      .query({ gateName: QUALITY_GATE,
        metric: 'security_hotspots_reviewed',
        op: 'LT',
        error: 100 })
    console.log('created condition', JSON.stringify(condRsp5.body))

    await request
      .post(`${SONARQUBE_SERVER_URL}/api/qualitygates/set_as_default`)
      .auth(SONARQUBE_TOKEN)
      .query({ name: QUALITY_GATE })
    console.log(`Created quality gate ${QUALITY_GATE} with conditions and set it as default`)
  } catch (err) {
    console.log('create err', err)
  }
}

createQualityGate()
