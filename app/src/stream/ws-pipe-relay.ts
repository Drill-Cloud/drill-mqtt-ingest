import type { IncomingMessage } from 'http'
import { WebSocket, WebSocketServer } from 'ws'

import { log } from '../helpers/log.js'
import { lastTopicSegment } from '../helpers/topic-match.js'

const wsPipePort = Number(process.env.WS_PIPE_PORT)
const LOG_INTERVAL_MS = 10_000

const wss = new WebSocketServer({ port: wsPipePort, perMessageDeflate: false })

const producersByChannel = new Map<string, WebSocket>()
const viewersByChannel = new Map<string, Set<WebSocket>>()
const lastLogByChannel = new Map<string, number>()

function getViewers(channel: string): Set<WebSocket> {
  let viewers = viewersByChannel.get(channel)
  if (!viewers) {
    viewers = new Set()
    viewersByChannel.set(channel, viewers)
  }
  return viewers
}

function broadcast(channel: string, chunk: Buffer): void {
  const clients = viewersByChannel.get(channel)
  if (!clients) return
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(chunk)
    }
  }
}

function logThroughput(channel: string, bytes: number): void {
  const now = Date.now()
  const lastLog = lastLogByChannel.get(channel) ?? 0
  if (now - lastLog >= LOG_INTERVAL_MS) {
    log(`pipe.in [${channel}] ↑ ${bytes}B`)
    lastLogByChannel.set(channel, now)
  }
}

function handleProducer(ws: WebSocket, channel: string): void {
  const existing = producersByChannel.get(channel)
  if (existing?.readyState === WebSocket.OPEN) {
    existing.close(1000, 'replaced')
  }
  producersByChannel.set(channel, ws)

  ws.on('message', (data, isBinary) => {
    if (!isBinary) return
    const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer)
    logThroughput(channel, chunk.length)
    broadcast(channel, chunk)
  })

  ws.on('close', () => {
    if (producersByChannel.get(channel) === ws) {
      producersByChannel.delete(channel)
    }
  })
}

function handleViewer(ws: WebSocket, channel: string, path: string): void {
  log(`pipe.out.connection ${path}`)
  const viewers = getViewers(channel)
  viewers.add(ws)

  ws.on('close', () => {
    viewers.delete(ws)
    if (viewers.size === 0) viewersByChannel.delete(channel)
  })
}

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const path = req.url?.split('?')[0] ?? ''

  if (path.startsWith('/in/')) {
    handleProducer(ws, lastTopicSegment(path))
    return
  }

  if (path.startsWith('/out/')) {
    handleViewer(ws, lastTopicSegment(path), path)
    return
  }

  ws.close(1008, 'unknown path')
})

wss.on('listening', () => {
  log('pipe.server_started', { port: wsPipePort })
})
