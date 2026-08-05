import { unlink } from 'node:fs/promises'

import { log } from '../helpers/log.js'
import { listReadySegments, type ReadySegment } from './segment-manifest.js'
import { ensureDir, uploadFile } from './yandex-disk.js'

const archiveDir = process.env.ARCHIVE_DIR ?? '/archive'
const remoteRoot = process.env.YANDEX_DISK_REMOTE_ROOT ?? 'drill-video-archive'
const scanIntervalMs = Number(process.env.ARCHIVE_UPLOAD_SCAN_SECONDS ?? 30) * 1000

type UploadStatus = 'READY_LOCAL' | 'UPLOADING' | 'UPLOADED'

const statusByPath = new Map<string, UploadStatus>()
const ensuredRemoteDirs = new Set<string>()

let scanning = false

function remoteDirFor(segment: ReadySegment): string {
  const date = segment.fileName.slice(0, 'YYYY-MM-DD'.length)
  return `${remoteRoot}/${segment.cameraId}/${date}`
}

async function ensureRemoteDir(remoteDir: string): Promise<void> {
  const parts = remoteDir.split('/')
  for (let depth = 1; depth <= parts.length; depth++) {
    const path = parts.slice(0, depth).join('/')
    if (ensuredRemoteDirs.has(path)) continue
    await ensureDir(path)
    ensuredRemoteDirs.add(path)
  }
}

async function processSegment(segment: ReadySegment): Promise<void> {
  const remoteDir = remoteDirFor(segment)
  const remotePath = `${remoteDir}/${segment.fileName}`

  statusByPath.set(segment.localPath, 'UPLOADING')
  log(`upload.start [${segment.cameraId}] ${segment.fileName} -> ${remotePath}`)

  await ensureRemoteDir(remoteDir)
  await uploadFile(segment.localPath, remotePath)
  statusByPath.set(segment.localPath, 'UPLOADED')
  log(`upload.done [${segment.cameraId}] ${segment.fileName}`)

  await unlink(segment.localPath)
  log(`upload.local-deleted [${segment.cameraId}] ${segment.fileName}`)
}

async function scan(): Promise<void> {
  if (scanning) return
  scanning = true
  try {
    const pending = listReadySegments(archiveDir).filter((segment) => {
      const status = statusByPath.get(segment.localPath)
      return status !== 'UPLOADING' && status !== 'UPLOADED'
    })

    if (pending.length > 0) {
      log(`upload.found ${pending.length} segment(s) ready`)
    }

    for (const segment of pending) {
      try {
        await processSegment(segment)
      } catch (error) {
        statusByPath.set(segment.localPath, 'READY_LOCAL')
        console.error(`upload.error [${segment.cameraId}] ${segment.fileName}:`, error)
      }
    }
  } finally {
    scanning = false
  }
}

export function startUploader(): void {
  if (!process.env.YANDEX_DISK_TOKEN) {
    log('uploader.disabled: YANDEX_DISK_TOKEN is not set')
    return
  }

  log(`uploader.started scanInterval=${scanIntervalMs / 1000}s remoteRoot=${remoteRoot}`)
  void scan()
  setInterval(() => void scan(), scanIntervalMs)
}
