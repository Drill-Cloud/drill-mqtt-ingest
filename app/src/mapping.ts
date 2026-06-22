import { readFileSync } from 'node:fs'

export type MappedMetric = {
  edge: string
  timestamp: string
  tag: string
  value: number
}

type MappingConfig = {
  edge: string
  tags: string[]
}

export type MetricMapper = {
  edge: string
  mapValues: (values: number[], timestamp: string) => MappedMetric[]
}

type MetricMapperOptions = {
  // filePath contract:
  // - built-in mappings are passed as URL via new URL('../mappings/*.json', import.meta.url);
  // - env overrides are expected as absolute paths inside the runtime container.
  filePath: string | URL
}

function readMappingConfig(filePath: string | URL): MappingConfig {
  return JSON.parse(readFileSync(filePath, 'utf8')) as MappingConfig
}

export function createMetricMapper(options: MetricMapperOptions): MetricMapper {
  const config = readMappingConfig(options.filePath)

  return {
    edge: config.edge,
    mapValues: (values, timestamp) =>
      values.map((value, index) => ({
        edge: config.edge,
        timestamp,
        tag: config.tags[index],
        value,
      })),
  }
}
