import { resolveHandler } from './registry.js'

type ErrorWithCause = Error & {
  cause?: unknown
}

type NodeError = Error & {
  code?: string
  address?: string
  port?: number
}

function getErrorCause(error: Error): NodeError | null {
  const cause = (error as ErrorWithCause).cause
  return cause instanceof Error ? (cause as NodeError) : null
}

function formatHandlerError(error: unknown): object {
  if (!(error instanceof Error)) {
    return { message: String(error) }
  }

  const cause = getErrorCause(error)

  return {
    message: error.message,
    cause: cause?.message,
    code: cause?.code,
    address: cause?.address,
    port: cause?.port,
    stack: error.stack,
  }
}

export async function routeMessage(
  topic: string,
  payload: Buffer,
): Promise<void> {
  try {
    const handler = resolveHandler(topic)

    if (!handler) {
      console.warn('mqtt.unhandled_topic', { topic })
      return
    }

    await handler(topic, payload)
  } catch (err) {
    console.error('mqtt.handler_error', { topic, error: formatHandlerError(err) })
  }
}
