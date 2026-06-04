import { parseJson } from '../helpers/parse.js'
import { isArrayOfLength125 } from '../helpers/validate.js'
import type { TopicHandler } from '../types.js'

export const TOPIC = 'poc/topic2'

export const handleTopic2: TopicHandler = async (topic, payload) => {
  const raw = parseJson(payload)

  if (!isArrayOfLength125(raw)) {
    console.warn('topic2.invalid_payload', { topic })
    return
  }

  console.log('topic2.received', { topic, length: raw.length })
}
