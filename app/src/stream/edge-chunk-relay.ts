import type { IncomingMessage } from 'http'
import { WebSocket, WebSocketServer } from 'ws'

import { log } from '../helpers/log.js'
import { lastTopicSegment } from '../helpers/topic-match.js'

const wsPort = Number(process.env.WS_PORT)

const wss = new WebSocketServer({ port: wsPort, perMessageDeflate: false })

const clientsByCamera = new Map<string, Set<WebSocket>>()

function getClients(cameraId: string): Set<WebSocket> {
  let clients = clientsByCamera.get(cameraId)
  if (!clients) {
    clients = new Set()
    clientsByCamera.set(cameraId, clients)
  }
  return clients
}

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  log(`ws.connection ${req.url}`);
  req.socket.setNoDelay(true)
  const cameraId = req.url ? lastTopicSegment(req.url) : 'v1';

  const clients = getClients(cameraId);
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws)
    if (clients.size === 0) clientsByCamera.delete(cameraId)
  });

})

export function onEdgeChunk(cameraId: string, chunk: Buffer): void {
  const clients = clientsByCamera.get(cameraId)
  if (!clients) return
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(chunk)
    }
  }
}
