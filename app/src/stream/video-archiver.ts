import { spawn, type ChildProcess } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { log } from '../helpers/log.js'

const archiveDir = '/archive'
const bucketSeconds = Number(process.env.ARCHIVE_BUCKET_SECONDS ?? 3600)

const ffmpegByCamera = new Map<string, ChildProcess>()

function buildArgs(cameraDir: string): string[] {
  return [
    '-hide_banner',
    '-loglevel', 'warning',

    '-f', 'mpegts',
    '-i', 'pipe:0',

    '-map', '0:v:0',
    '-an',
    '-c:v', 'copy',

    '-f', 'segment',
    '-segment_time', String(bucketSeconds),
    '-segment_atclocktime', '1',
    '-reset_timestamps', '1',

    '-segment_list', join(cameraDir, 'segments.csv'),
    '-segment_list_type', 'csv',
    '-segment_list_size', '0',

    '-strftime', '1',
    join(cameraDir, '%Y-%m-%d_%H-%M-%S.ts'),
  ]
}

function spawnFfmpeg(cameraId: string): ChildProcess {
  const cameraDir = join(archiveDir, cameraId)
  mkdirSync(cameraDir, { recursive: true })

  const ffmpeg = spawn('ffmpeg', buildArgs(cameraDir), {
    stdio: ['pipe', 'ignore', 'pipe'],
  })

  ffmpeg.stderr!.on('data', (buffer: Buffer) => {
    console.warn(`[ffmpeg ${cameraId}] ${buffer.toString().trim()}`)
  })

  ffmpeg.on('error', (error) => {
    console.error(`[ffmpeg ${cameraId}] spawn failed:`, error)
    ffmpegByCamera.delete(cameraId)
  })

  ffmpeg.on('close', (code, signal) => {
    log(`[ffmpeg ${cameraId}] stopped: code=${code}, signal=${signal}`)
    ffmpegByCamera.delete(cameraId)
  })

  log(`[ffmpeg ${cameraId}] started, segment=${bucketSeconds}s, dir=${cameraDir}`)
  return ffmpeg
}

export function archiveChunk(cameraId: string, chunk: Buffer): void {
  let ffmpeg = ffmpegByCamera.get(cameraId)
  if (!ffmpeg) {
    ffmpeg = spawnFfmpeg(cameraId)
    ffmpegByCamera.set(cameraId, ffmpeg)
  }
  if (ffmpeg.stdin?.writable) {
    ffmpeg.stdin.write(chunk)
  }
}

export function shutdownArchiver(): Promise<void[]> {
  const closings = [...ffmpegByCamera.values()].map(
    (ffmpeg) =>
      new Promise<void>((resolve) => {
        ffmpeg.once('close', () => resolve())
        ffmpeg.stdin?.end()
      }),
  )
  return Promise.all(closings)
}
