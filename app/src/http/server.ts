import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const httpPort = Number(process.env.HTTP_PORT ?? 80)
const publicDir = join(dirname(fileURLToPath(import.meta.url)), '../../public')
const indexPath = join(publicDir, 'index.html')

createServer(async (req, res) => {
  const path = req.url?.split('?')[0]

  if (path === '/' || path === '/index.html') {
    try {
      const html = await readFile(indexPath, 'utf8')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)
    } catch (err) {
      console.error('http.read_index_error', err)
      res.writeHead(500).end('Internal Server Error')
    }
    return
  }

  res.writeHead(404).end('Not Found')
}).listen(httpPort, () => {
  console.log('http.server_started', { port: httpPort })
})
