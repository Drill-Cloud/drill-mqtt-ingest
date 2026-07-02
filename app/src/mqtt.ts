import mqtt from 'mqtt'

import { log } from './helpers/log.js'
import { getRegisteredTopics } from './registry.js'
import { routeMessage } from './router.js'

const mqttUrl = process.env.MQTT_URL as string

export const mqttClient = mqtt.connect(mqttUrl)

mqttClient.on('connect', () => {
  log('mqtt.connected', { url: mqttUrl })

  const topics = getRegisteredTopics()
  if (topics.length === 0) {
    console.warn('mqtt.no_topics_registered')
    return
  }

  mqttClient.subscribe(topics, (err) => {
    if (err) {
      console.error('mqtt.subscribe_error', err)
      return
    }
    log('mqtt.subscribed', { topics })
  })
})

mqttClient.on('message', (topic, payload) => {
  void routeMessage(topic, payload)
})

mqttClient.on('error', (err) => {
  console.error('mqtt.error', err)
})

mqttClient.on('reconnect', () => {
  log('mqtt.reconnect')
})
