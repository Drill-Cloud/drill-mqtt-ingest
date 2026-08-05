import { log } from '../helpers/log.js'
import { lastTopicSegment } from '../helpers/topic-match.js'
import { broadcastChunk } from '../stream/edge-chunk-relay.js'
import type { TopicHandler } from '../types.js'

const LOG_INTERVAL_MS = 10_000

let lastV1Log = 0
const lastV2LogByCamera = new Map<string, number>()

export const handleDemoVideo: TopicHandler = async (_topic, payload) => {
  const now = Date.now()
  if (now - lastV1Log >= LOG_INTERVAL_MS) {
    log(`demo.video up ${payload.length}B`)
    lastV1Log = now
  }

  broadcastChunk('v1', payload)
}

export const handleDemoVideoV2: TopicHandler = async (topic, payload) => {
  const cameraId = lastTopicSegment(topic)

  const now = Date.now()
  const lastLog = lastV2LogByCamera.get(cameraId) ?? 0
  if (now - lastLog >= LOG_INTERVAL_MS) {
    log(`demo.video.v2 [${cameraId}] up ${payload.length}B`)
    lastV2LogByCamera.set(cameraId, now)
  }

  broadcastChunk(cameraId, payload)
}
