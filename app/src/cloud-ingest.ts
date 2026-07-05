export const cloudIngestUrl = process.env.CLOUD_INGEST_URL as string
export const demoCloudIngestUrl = process.env.DEMO_CLOUD_INGEST_URL as string

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

export function postDemoCloudIngest(body: unknown): Promise<Response> {
  return fetch(demoCloudIngestUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.CLOUD_INGEST_API_KEY as string,
    },
    body: JSON.stringify(body),
  })
}
