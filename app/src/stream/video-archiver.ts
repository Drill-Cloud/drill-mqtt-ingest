import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { log } from '../helpers/log.js';

const archiveDir = '/archive';
const bucketSeconds = Number(process.env.ARCHIVE_BUCKET_SECONDS ?? 3600);

const IDLE_TIMEOUT_MS = 60_000;
const IDLE_CHECK_INTERVAL_MS = 15_000;

const ffmpegByCamera = new Map<string, ChildProcess>();
const lastChunkAtByCamera = new Map<string, number>();

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

function spawnFFmpeg(cameraId: string): ChildProcess {
  const cameraDir = join(archiveDir, cameraId);
  mkdirSync(cameraDir, { recursive: true });

  const ffmpeg = spawn('ffmpeg', buildArgs(cameraDir), {
    stdio: ['pipe', 'ignore', 'pipe'],
  })

  ffmpeg.stderr!.on('data', (buffer: Buffer) => {
    console.warn(`[ffmpeg ${cameraId}] ${buffer.toString().trim()}`);
  })

  ffmpeg.on('error', (error) => {
    console.error(`[ffmpeg ${cameraId}] spawn failed:`, error);
    ffmpegByCamera.delete(cameraId);
  })

  ffmpeg.on('close', (code, signal) => {
    log(`[ffmpeg ${cameraId}] stopped: code=${code}, signal=${signal}`);
    ffmpegByCamera.delete(cameraId);
  })

  log(`[ffmpeg ${cameraId}] started, segment=${bucketSeconds}s, dir=${cameraDir}`);
  return ffmpeg;
}

function finalizeIdleArchivers(): void {
  const now = Date.now()
  for (const [cameraId, ffmpeg] of ffmpegByCamera) {
    const lastChunkAt = lastChunkAtByCamera.get(cameraId) ?? 0
    if (now - lastChunkAt <= IDLE_TIMEOUT_MS) continue

    log(`[ffmpeg ${cameraId}] stream idle > ${IDLE_TIMEOUT_MS / 1000}s, finalizing segment`)
    // отвязываем сразу: возобновившийся поток создаст новый процесс,
    // пока старый дописывает сегмент и завершается
    ffmpegByCamera.delete(cameraId);
    lastChunkAtByCamera.delete(cameraId);
    ffmpeg.stdin?.end();
  }
}

setInterval(finalizeIdleArchivers, IDLE_CHECK_INTERVAL_MS)

export function archiveChunk(cameraId: string, chunk: Buffer): void {
  let ffmpeg = ffmpegByCamera.get(cameraId);
  if (!ffmpeg) {
    ffmpeg = spawnFFmpeg(cameraId);
    ffmpegByCamera.set(cameraId, ffmpeg)
  }
  lastChunkAtByCamera.set(cameraId, Date.now());
  if (ffmpeg.stdin?.writable) {
    ffmpeg.stdin.write(chunk);
  }
}

export function shutdownArchiver(): Promise<void[]> {
  const closings = [...ffmpegByCamera.values()].map(
    (ffmpeg) =>
      new Promise<void>((resolve) => {
        ffmpeg.once('close', () => resolve());
        ffmpeg.stdin?.end();
      }),
  )
  return Promise.all(closings);
}
