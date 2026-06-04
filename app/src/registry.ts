import type { TopicHandler } from './types.js'

const handlers = new Map<string, TopicHandler>()

export function register(topic: string, handler: TopicHandler): void {
  if (handlers.has(topic)) {
    throw new Error(`Handler already registered for topic: ${topic}`)
  }
  handlers.set(topic, handler)
}

export function getHandler(topic: string): TopicHandler | undefined {
  return handlers.get(topic)
}

export function getRegisteredTopics(): string[] {
  return [...handlers.keys()]
}
