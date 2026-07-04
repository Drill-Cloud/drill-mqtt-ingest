import { topicMatchesFilter } from './helpers/topic-match.js'
import type { TopicHandler } from './types.js'

const exactHandlers = new Map<string, TopicHandler>()
const patternHandlers = new Map<string, TopicHandler>()

function isPatternTopic(topic: string): boolean {
  return topic.includes('+') || topic.includes('#')
}

export function register(topic: string, handler: TopicHandler): void {
  const handlers = isPatternTopic(topic) ? patternHandlers : exactHandlers

  if (handlers.has(topic)) {
    throw new Error(`Handler already registered for topic: ${topic}`)
  }
  handlers.set(topic, handler)
}

export function resolveHandler(topic: string): TopicHandler | undefined {
  const exact = exactHandlers.get(topic)
  if (exact) {
    return exact
  }

  for (const [filter, handler] of patternHandlers) {
    if (topicMatchesFilter(filter, topic)) {
      return handler
    }
  }

  return undefined
}

export function getRegisteredTopics(): string[] {
  return [...exactHandlers.keys(), ...patternHandlers.keys()]
}
