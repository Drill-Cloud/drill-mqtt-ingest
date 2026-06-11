import { readFileSync } from 'node:fs'

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
  // filePath is set as a URL from import.meta.url for bundled mappings,
  // or as a path string resolved by Node from the process working directory.
  filePath: string | URL
}

function readMappingConfig(filePath: string | URL): MappingConfig {
  return JSON.parse(readFileSync(filePath, 'utf8')) as MappingConfig
}

export function createMetricMapper(options: MetricMapperOptions): MetricMapper {
  const config = readMappingConfig(options.filePath)
  const tags = config.tags.map((entry) =>
    typeof entry === 'string' ? entry : 'tag' in entry ? entry.tag : entry.key,
  )

  return {
    edge: config.edge,
    tagCount: tags.length,
    mapValues: (values, timestamp) =>
      values.map((value, index) => ({
        edge: config.edge,
        timestamp,
        tag: tags[index],
        value,
      })),
  }
}
