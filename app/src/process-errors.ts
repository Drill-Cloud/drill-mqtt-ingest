type ErrorWithCause = Error & {
  cause?: unknown
}

type NodeError = Error & {
  code?: string
  address?: string
  port?: number
}

// Undici кладёт системную ошибку соединения внутрь error.cause.
function getFetchCause(error: unknown): NodeError | null {
  if (!(error instanceof Error)) {
    return null
  }

  const cause = (error as ErrorWithCause).cause
  return cause instanceof Error ? (cause as NodeError) : null
}

// Обрабатываем только подсвеченный кейс: backend отказал в TCP-соединении.
function isFetchConnectionRefused(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const cause = getFetchCause(error)
  return error.message === 'fetch failed' && cause?.code === 'ECONNREFUSED'
}

// Логируем короткую диагностическую форму без огромного stack trace.
function formatFetchError(error: unknown): object {
  if (!(error instanceof Error)) {
    return { message: String(error) }
  }

  const cause = getFetchCause(error)
  return {
    message: error.message,
    cause: cause?.message,
    code: cause?.code,
    address: cause?.address,
    port: cause?.port,
  }
}

// Последний рубеж защиты для fire-and-forget fetch-запросов.
// Если backend недоступен, Node.js 22 может превратить незахваченный
// fetch failed / ECONNREFUSED в падение всего процесса mqtt-worker.
process.on('unhandledRejection', (error) => {
  if (isFetchConnectionRefused(error)) {
    console.error('process.unhandled_fetch_refused', formatFetchError(error))
    return
  }

  console.error('process.unhandled_rejection', error)
})
