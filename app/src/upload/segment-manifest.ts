import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

export interface ReadySegment {
  cameraId: string
  fileName: string
  localPath: string
}

// Сегмент готов, если ffmpeg не писал в него дольше readyAfterMs:
// в текущий сегмент чанки пишутся непрерывно, «остывший» файл финализирован.
export function listReadySegments(archiveDir: string, readyAfterMs: number): ReadySegment[] {
  if (!existsSync(archiveDir)) return []

  const now = Date.now()
  const segments: ReadySegment[] = []

  for (const cameraEntry of readdirSync(archiveDir, { withFileTypes: true })) {
    if (!cameraEntry.isDirectory()) continue

    const cameraId = cameraEntry.name
    const cameraDir = join(archiveDir, cameraId)

    for (const fileName of readdirSync(cameraDir)) {
      if (!fileName.endsWith('.ts')) continue

      const localPath = join(cameraDir, fileName)
      if (now - statSync(localPath).mtimeMs > readyAfterMs) {
        segments.push({ cameraId, fileName, localPath })
      }
    }
  }

  return segments
}
