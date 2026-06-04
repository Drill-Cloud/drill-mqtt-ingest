import { onEdgeChunk } from '../stream/edge-chunk-relay.js'
import type { TopicHandler } from '../types.js'

export const TOPIC = 'data/edge5/video/v1'

export const handleEdge5Video: TopicHandler = async (topic, payload) => {
  console.log('edge5.video.received', {
    topic,
    bytes: payload.length,
    payload,
  })
  onEdgeChunk(payload)
}
