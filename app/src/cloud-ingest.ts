const DEFAULT_CLOUD_INGEST_URL = 'http://localhost:3100/ingest'

export const cloudIngestUrl =
  process.env.CLOUD_INGEST_URL ?? DEFAULT_CLOUD_INGEST_URL

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }

  const apiKey = process.env.CLOUD_INGEST_API_KEY?.trim()
  if (apiKey) {
    headers['x-api-key'] = apiKey
  }

  return headers
}

export function postCloudIngest(body: unknown): Promise<Response> {
  return fetch(cloudIngestUrl, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
}
