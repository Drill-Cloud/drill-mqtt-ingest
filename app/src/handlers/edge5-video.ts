import { log } from '../helpers/log.js'
import { broadcastChunk } from '../stream/edge-chunk-relay.js'
import type { TopicHandler } from '../types.js'

const LOG_INTERVAL_MS = 10_000
let lastLog = 0

export const handleEdge5Video: TopicHandler = async (_topic, payload) => {
  const now = Date.now()
  if (now - lastLog >= LOG_INTERVAL_MS) {
    log(`edge5.video ↑ ${payload.length}B`)
    lastLog = now
  }
  
  broadcastChunk('v1', payload);
}