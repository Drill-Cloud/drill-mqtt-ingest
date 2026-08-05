import { log } from '../helpers/log.js'
import { lastTopicSegment } from '../helpers/topic-match.js'
import { broadcastChunk } from '../stream/edge-chunk-relay.js'
import { archiveChunk } from '../stream/video-archiver.js'
import type { TopicHandler } from '../types.js'

const LOG_INTERVAL_MS = 60_000;

const lastLogByCamera = new Map<string, number>()

export const handleDevVideoV2: TopicHandler = async (topic, payload) => {
  const cameraId = 'dev-' + lastTopicSegment(topic)

  const now = Date.now()
  const lastLog = lastLogByCamera.get(cameraId) ?? 0
  if (now - lastLog >= LOG_INTERVAL_MS) {
    log(`dev.video.v2 [${cameraId}] ↑ ${payload.length}B`)
    lastLogByCamera.set(cameraId, now)
  }

  broadcastChunk(cameraId, payload);
  archiveChunk(cameraId, payload);
}
