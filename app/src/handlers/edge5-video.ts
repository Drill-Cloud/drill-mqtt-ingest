import { onEdgeChunk } from '../stream/edge-chunk-relay.js'
import type { TopicHandler } from '../types.js'

const BEACON_MS = 3000
let lastBeacon = 0

export const handleEdge5Video: TopicHandler = async (_topic, payload) => {
  const now = Date.now()
  if (now - lastBeacon >= BEACON_MS) {
    console.log(`edge5.video ↑ ${payload.length}B`)
    lastBeacon = now
  }
  onEdgeChunk(payload)
}
