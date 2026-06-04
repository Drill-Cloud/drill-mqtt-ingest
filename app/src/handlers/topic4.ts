import { parseJson } from '../helpers/parse.js'
import { isFiniteNumber } from '../helpers/validate.js'
import type { TopicHandler } from '../types.js'

export const TOPIC = 'poc/topic4'

type Topic4Payload = {
  value: number
}

function isTopic4Payload(value: unknown): value is Topic4Payload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    isFiniteNumber((value as Topic4Payload).value)
  )
}

export const handleTopic4: TopicHandler = async (topic, payload) => {
  const raw = parseJson(payload)

  if (!isTopic4Payload(raw)) {
    console.warn('topic4.invalid_payload', { topic })
    return
  }

  console.log('topic4.received', { topic, value: raw.value })
}
