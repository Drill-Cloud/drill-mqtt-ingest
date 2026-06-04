import { getHandler } from './registry.js'

export async function routeMessage(
  topic: string,
  payload: Buffer,
): Promise<void> {
  const handler = getHandler(topic)

  if (!handler) {
    console.warn('mqtt.unhandled_topic', { topic })
    return
  }

  try {
    await handler(topic, payload)
  } catch (err) {
    console.error('mqtt.handler_error', { topic, err })
  }
}
