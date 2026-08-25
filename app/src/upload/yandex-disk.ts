import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'

const API_BASE = 'https://cloud-api.yandex.net/v1/disk'

function authHeaders(): Record<string, string> {
  return { Authorization: `OAuth ${process.env.YANDEX_DISK_TOKEN}` }
}

export async function ensureDir(remotePath: string): Promise<void> {
  const response = await fetch(
    `${API_BASE}/resources?path=${encodeURIComponent(remotePath)}`,
    { method: 'PUT', headers: authHeaders() },
  )
  if (response.status === 201) return
  const body = await response.text()
  // 409 бывает трёх видов; успех — только "папка уже существует"
  if (response.status === 409 && body.includes('DiskPathPointsToExistentDirectoryError')) return
  throw new Error(`mkdir "${remotePath}": ${response.status} ${body}`)
}

export async function uploadFile(localPath: string, remotePath: string): Promise<void> {
  const uploadUrlResponse = await fetch(
    `${API_BASE}/resources/upload?path=${encodeURIComponent(remotePath)}&overwrite=true`,
    { headers: authHeaders() },
  )
  if (!uploadUrlResponse.ok) {
    throw new Error(
      `get upload url "${remotePath}": ${uploadUrlResponse.status} ${await uploadUrlResponse.text()}`,
    )
  }
  const { href } = (await uploadUrlResponse.json()) as { href: string }

  const putResponse = await fetch(href, {
    method: 'PUT',
    body: Readable.toWeb(createReadStream(localPath)) as unknown as BodyInit,
    duplex: 'half', // required by Node fetch for streaming bodies
  } as RequestInit)
  if (!putResponse.ok) {
    throw new Error(`put "${remotePath}": ${putResponse.status} ${await putResponse.text()}`)
  }
}
