import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface ReadySegment {
  cameraId: string
  fileName: string
  localPath: string
}

const MANIFEST_NAME = 'segments.csv'

export function listReadySegments(archiveDir: string): ReadySegment[] {
  if (!existsSync(archiveDir)) return []

  const segments: ReadySegment[] = []

  for (const entry of readdirSync(archiveDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue

    const cameraId = entry.name
    const manifestPath = join(archiveDir, cameraId, MANIFEST_NAME)
    if (!existsSync(manifestPath)) continue

    for (const line of readFileSync(manifestPath, 'utf8').split('\n')) {
      const fileName = line.split(',')[0]?.trim()
      if (!fileName) continue

      const localPath = join(archiveDir, cameraId, fileName)
      if (existsSync(localPath)) {
        segments.push({ cameraId, fileName, localPath })
      }
    }
  }

  return segments
}
