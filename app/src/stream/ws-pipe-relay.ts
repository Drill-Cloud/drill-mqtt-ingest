import type { IncomingMessage } from 'http'
import { createServer } from 'http'
import { WebSocket, WebSocketServer } from 'ws'

import { log } from '../helpers/log.js'
import { lastTopicSegment } from '../helpers/topic-match.js'

const wsPipePort = Number(process.env.WS_PIPE_PORT)
const httpIngestPort = Number(process.env.HTTP_INGEST_PORT) // новый порт, например 3456
const LOG_INTERVAL_MS = 10_000

const wss = new WebSocketServer({ port: wsPipePort, perMessageDeflate: false })

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

// --- HTTP ingest ---
const httpIngest = createServer((req: IncomingMessage, res) => {
  const path = req.url?.split('?')[0] ?? ''

  if (!path.startsWith('/in/')) {
    res.writeHead(404).end()
    return
  }

  const channel = lastTopicSegment(path)
  log(`pipe.in.http_connected [${channel}]`)

  req.on('data', (chunk: Buffer) => {
    logThroughput(channel, chunk.length)
    broadcast(channel, chunk)
  })

  req.on('end', () => {
    log(`pipe.in.http_disconnected [${channel}]`)
    res.writeHead(200).end()
  })

  req.on('error', (err) => {
    log(`pipe.in.http_error [${channel}]`, err)
    res.writeHead(500).end()
  })
})

httpIngest.listen(httpIngestPort, () => {
  log('pipe.http_ingest_started', { port: httpIngestPort })
})

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
  req.socket.setNoDelay(true);

  if (path.startsWith('/out/')) {
    handleViewer(ws, lastTopicSegment(path), path)
    return
  }

  ws.close(1008, 'unknown path')
})

wss.on('listening', () => {
  log('pipe.server_started', { port: wsPipePort })
})
