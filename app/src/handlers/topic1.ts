import { parseJson } from '../helpers/parse.js'
import { isArrayOfChunks125 } from '../helpers/validate.js'
import type { TopicHandler } from '../types.js'

export const TOPIC = 'poc/topic1'

export const handleTopic1: TopicHandler = async (topic, payload) => {
  const raw = parseJson(payload)

  if (!isArrayOfChunks125(raw)) {
    console.warn('topic1.invalid_payload', { topic })
    return
  }

  console.log('topic1.received', { topic, chunks: raw.length })
}
