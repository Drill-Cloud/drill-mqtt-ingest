import './handlers/index.js'
import './http/server.js'
import './mqtt.js'
import './stream/edge-chunk-relay.js'

import { log } from './helpers/log.js'
import { shutdownArchiver } from './stream/video-archiver.js'
import { startUploader } from './upload/uploader.js'

log('mqtt-worker.started')

startUploader()

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  log(`mqtt-worker.${signal.toLowerCase()}, closing archiver`)
  await shutdownArchiver()
  log('mqtt-worker.stopped')
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
