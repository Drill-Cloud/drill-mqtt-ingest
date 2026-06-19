export function parseUtf8(payload: Buffer): string {
  return payload.toString('utf8')
}

export function parseJson<T = unknown>(payload: Buffer): T {
  const text = parseUtf8(payload)
  return JSON.parse(text) as T
}

export function decodeBase64(payload: Buffer): Buffer {
  return Buffer.from(payload.toString('utf8'), 'base64')
}
