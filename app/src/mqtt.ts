import mqtt from 'mqtt'

import { getRegisteredTopics } from './registry.js'
import { routeMessage } from './router.js'

const mqttUrl = process.env.MQTT_URL ?? 'mqtt://localhost:1883'

export const mqttClient = mqtt.connect(mqttUrl)

mqttClient.on('connect', () => {
  console.log('mqtt.connected', { url: mqttUrl })

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
    console.log('mqtt.subscribed', { topics })
  })
})

mqttClient.on('message', (topic, payload) => {
  void routeMessage(topic, payload)
})

mqttClient.on('error', (err) => {
  console.error('mqtt.error', err)
})

mqttClient.on('reconnect', () => {
  console.log('mqtt.reconnect')
})
