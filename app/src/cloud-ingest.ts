const DEFAULT_CLOUD_INGEST_URL = 'http://localhost:3101/ingest'

export const cloudIngestUrl =
  process.env.CLOUD_INGEST_URL ?? DEFAULT_CLOUD_INGEST_URL

export function postCloudIngest(body: unknown): Promise<Response> {
  return fetch(cloudIngestUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.CLOUD_INGEST_API_KEY as string,
    },
    body: JSON.stringify(body),
  })
}
