import { parseUtf8 } from '../helpers/parse.js'
import { isNonEmptyString } from '../helpers/validate.js'
import type { TopicHandler } from '../types.js'

export const TOPIC = 'poc/topic3'

export const handleTopic3: TopicHandler = async (topic, payload) => {
  const text = parseUtf8(payload)

  if (!isNonEmptyString(text)) {
    console.warn('topic3.invalid_payload', { topic })
    return
  }

  console.log('topic3.received', { topic, text })
}
