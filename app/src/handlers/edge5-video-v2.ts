import { log } from '../helpers/log.js'
import { lastTopicSegment } from '../helpers/topic-match.js'
import { onEdgeChunk } from '../stream/edge-chunk-relay.js'
import type { TopicHandler } from '../types.js'

const LOG_INTERVAL_MS = 10 * 60_000
const TRAFFIC_LOG_INTERVAL_MS = 30 * 60_000
const MINUTE_MS = 60_000
const HOUR_MINUTES = 60
const DAY_MINUTES = 24 * 60

const lastLogByCamera = new Map<string, number>()
const sinceLastLogByCamera = new Map<string, number>()
const minuteBucketsByCamera = new Map<string, Map<number, number>>()

let lastTrafficLogAt = Date.now()

function addBytes(cameraId: string, bytes: number, now: number): void {
  sinceLastLogByCamera.set(cameraId, (sinceLastLogByCamera.get(cameraId) ?? 0) + bytes)

  const minute = Math.floor(now / MINUTE_MS)
  let buckets = minuteBucketsByCamera.get(cameraId)
  if (!buckets) {
    buckets = new Map()
    minuteBucketsByCamera.set(cameraId, buckets)
  }
  buckets.set(minute, (buckets.get(minute) ?? 0) + bytes)

  const keepFrom = minute - DAY_MINUTES
  for (const key of buckets.keys()) {
    if (key < keepFrom) buckets.delete(key)
  }
}

function sumLastMinutes(cameraId: string, minutes: number, now: number): number {
  const buckets = minuteBucketsByCamera.get(cameraId)
  if (!buckets) return 0

  const current = Math.floor(now / MINUTE_MS)
  let sum = 0
  for (let i = 0; i < minutes; i++) {
    sum += buckets.get(current - i) ?? 0
  }
  return sum
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)}KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)}MB`
  return `${(bytes / 1024 ** 3).toFixed(2)}GB`
}

function formatCameraTraffic(cameraId: string, now: number): string {
  const sinceLast = sinceLastLogByCamera.get(cameraId) ?? 0
  const hour = sumLastMinutes(cameraId, HOUR_MINUTES, now)
  const day = sumLastMinutes(cameraId, DAY_MINUTES, now)
  return `[${cameraId}] sinceLast=${formatBytes(sinceLast)} hour=${formatBytes(hour)} day=${formatBytes(day)}`
}

function maybeLogTraffic(now: number): void {
  if (now - lastTrafficLogAt < TRAFFIC_LOG_INTERVAL_MS) return

  const cameraIds = [...new Set([
    ...sinceLastLogByCamera.keys(),
    ...minuteBucketsByCamera.keys(),
  ])].sort()

  if (cameraIds.length === 0) {
    lastTrafficLogAt = now
    return
  }

  let sinceLastAll = 0
  let hourAll = 0
  let dayAll = 0
  const lines: string[] = []

  for (const cameraId of cameraIds) {
    lines.push(formatCameraTraffic(cameraId, now))
    sinceLastAll += sinceLastLogByCamera.get(cameraId) ?? 0
    hourAll += sumLastMinutes(cameraId, HOUR_MINUTES, now)
    dayAll += sumLastMinutes(cameraId, DAY_MINUTES, now)
    sinceLastLogByCamera.set(cameraId, 0)
  }

  log(
    `edge5.video.v2.traffic\n` +
    lines.join('\n') +
    `\n[all] sinceLast=${formatBytes(sinceLastAll)} hour=${formatBytes(hourAll)} day=${formatBytes(dayAll)}`,
  )

  lastTrafficLogAt = now
}

export const handleEdge5VideoV2: TopicHandler = async (topic, payload) => {
  const cameraId = lastTopicSegment(topic)
  const now = Date.now()

  addBytes(cameraId, payload.length, now)

  const lastLog = lastLogByCamera.get(cameraId) ?? 0
  if (now - lastLog >= LOG_INTERVAL_MS) {
    log(`edge5.video.v2 [${cameraId}] ↑ ${payload.length}B`)
    lastLogByCamera.set(cameraId, now)
  }

  maybeLogTraffic(now)

  onEdgeChunk(cameraId, payload)
}
