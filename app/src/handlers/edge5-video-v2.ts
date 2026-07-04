import { log } from '../helpers/log.js'
import { lastTopicSegment } from '../helpers/topic-match.js'
import type { TopicHandler } from '../types.js'

const LOG_INTERVAL_MS = 10_000

const lastLogByCamera = new Map<string, number>()

export const handleEdge5VideoV2: TopicHandler = async (topic, payload) => {
  const cameraId = lastTopicSegment(topic)

  if (!cameraId) {
    console.warn('edge5.video.v2.invalid_topic', { topic })
    return
  }

  const now = Date.now()
  const lastLog = lastLogByCamera.get(cameraId) ?? 0
  if (now - lastLog >= LOG_INTERVAL_MS) {
    log(`edge5.video.v2 [${cameraId}] ↑ ${payload.length}B`)
    lastLogByCamera.set(cameraId, now)
  }
}
