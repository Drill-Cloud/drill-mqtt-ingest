import { log } from '../helpers/log.js'
import { onEdgeChunk } from '../stream/edge-chunk-relay.js'
import type { TopicHandler } from '../types.js'

export const handleEdge5Video: TopicHandler = async (_topic, payload) => {
  log(`edge5.video ↑ ${payload.length}B`);
  onEdgeChunk(payload);
}
