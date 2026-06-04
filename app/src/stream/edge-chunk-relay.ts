import type { IncomingMessage } from 'http'
import { WebSocket, WebSocketServer } from 'ws'

const wsPort = Number(process.env.WS_PORT ?? 9090)

const wss = new WebSocketServer({ port: wsPort, perMessageDeflate: false })
const clients = new Set<WebSocket>()

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  clients.add(ws)
  console.log('ws.client_connected', {
    clients: clients.size,
    ip: req.socket.remoteAddress,
  })

  ws.on('close', () => {
    clients.delete(ws)
    console.log('ws.client_closed', { clients: clients.size })
  })
})

wss.on('listening', () => {
  console.log('ws.server_started', { port: wsPort })
})

export function onEdgeChunk(chunk: Buffer): void {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(chunk)
    }
  }
}
