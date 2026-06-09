import { readFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export type MappedMetric = {
  edge: string
  timestamp: number
  tag: string
  value: number
}

type MappingTagEntry = string | { tag: string } | { key: string }

type MappingConfig = {
  edge: string
  tags: MappingTagEntry[]
}

export type MetricMapper = {
  edge: string
  tagCount: number
  mapValues: (values: number[], timestamp: number) => MappedMetric[]
}

type MetricMapperOptions = {
  filePath: string | URL
}

function resolveMappingPath(filePath: string | URL): string {
  if (filePath instanceof URL) {
    return fileURLToPath(filePath)
  }

  return isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath)
}

function readMappingConfig(filePath: string | URL): MappingConfig {
  const resolvedPath = resolveMappingPath(filePath)
  let raw: unknown

  try {
    raw = JSON.parse(readFileSync(resolvedPath, 'utf8')) as unknown
  } catch (err) {
    throw new Error(`Failed to read mapping file ${resolvedPath}: ${String(err)}`)
  }

  if (!isMappingConfig(raw)) {
    throw new Error(`Invalid mapping file ${resolvedPath}`)
  }

  return raw
}

function isMappingConfig(value: unknown): value is MappingConfig {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<MappingConfig>

  return (
    typeof candidate.edge === 'string' &&
    candidate.edge.length > 0 &&
    Array.isArray(candidate.tags) &&
    candidate.tags.length > 0 &&
    candidate.tags.every(isMappingTagEntry)
  )
}

function isMappingTagEntry(value: unknown): value is MappingTagEntry {
  return (
    (typeof value === 'string' && value.length > 0) ||
    (Boolean(value) &&
      typeof value === 'object' &&
      ((typeof (value as { tag?: unknown }).tag === 'string' &&
        (value as { tag: string }).tag.length > 0) ||
        (typeof (value as { key?: unknown }).key === 'string' &&
          (value as { key: string }).key.length > 0)))
  )
}

function getTag(entry: MappingTagEntry): string {
  if (typeof entry === 'string') {
    return entry
  }

  return 'tag' in entry ? entry.tag : entry.key
}

export function createMetricMapper(options: MetricMapperOptions): MetricMapper {
  const config = readMappingConfig(options.filePath)
  const tags = config.tags.map(getTag)

  return {
    edge: config.edge,
    tagCount: tags.length,
    mapValues: (values, timestamp) => {
      if (values.length !== tags.length) {
        throw new Error(`Expected ${tags.length} values, got ${values.length}`)
      }

      return values.map((value, index) => ({
        edge: config.edge,
        timestamp,
        tag: tags[index],
        value,
      }))
    },
  }
}
