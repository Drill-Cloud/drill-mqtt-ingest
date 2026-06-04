export type TopicHandler = (
  topic: string,
  payload: Buffer,
) => Promise<void>

export type TopicSubscription =
  | string
  | string[]
  | Record<string, { qos?: 0 | 1 | 2 }>
