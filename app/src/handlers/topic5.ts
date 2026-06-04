import { parseJsonArray } from '../helpers/parse.js'
import type { TopicHandler } from '../types.js'

export const TOPIC = 'poc/topic5'

export const handleTopic5: TopicHandler = async (topic, payload) => {
  const items = parseJsonArray(payload)

  console.log('topic5.received', { topic, count: items.length })
}
