import { postCloudIngest } from '../cloud-ingest.js'
import { createMetricMapper, type MappedMetric } from '../mapping.js'
import type { TopicHandler } from '../types.js'

export const TOPIC = 'data/edge5/modbus/v2'

const mapper = createMetricMapper({
  filePath:
    process.env.EDGE5_MODBUS_V2_MAPPING_FILE ??
    new URL('../mappings/edge5-modbus.json', import.meta.url),
})
const REGISTER_COUNT = mapper.tagCount

function parseValues(payload: Buffer): number[] {
  const value = JSON.parse(payload.toString('utf8')) as unknown

  if (
    Array.isArray(value) &&
    value.length === REGISTER_COUNT &&
    value.every((item) => typeof item === 'number' && Number.isFinite(item))
  ) {
    return value
  }

  throw new Error(`Expected JSON number[${REGISTER_COUNT}]`)
}

async function postMetrics(metrics: MappedMetric[]): Promise<void> {
  const response = await postCloudIngest(metrics)

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }

  console.log('edge5.modbus.v2.posted', { count: metrics.length })
}

export const handleEdge5ModbusV2: TopicHandler = async (topic, payload) => {
  console.log('edge5.modbus.v2.received', { topic, bytes: payload.length })

  const values = parseValues(payload)
  const metrics = mapper.mapValues(values, Date.now())
  await postMetrics(metrics)
}
