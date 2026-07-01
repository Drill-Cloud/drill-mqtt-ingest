import { postCloudIngest } from '../cloud-ingest.js'
import { createMetricMapper, type MappedMetric } from '../mapping.js'
import type { TopicHandler } from '../types.js'

const REGISTER_COUNT = 125

const mapper = createMetricMapper({
  filePath: process.env.EDGE5_MODBUS_V2_MAPPING_FILE as string,
})

function parseValues(payload: Buffer): number[] {
  const values = JSON.parse(payload.toString('utf8')) as number[]
  assertRegisterCount(values)
  return values
}

function assertRegisterCount(values: number[]): void {
  if (values.length !== REGISTER_COUNT) {
    throw new Error(`Expected ${REGISTER_COUNT} modbus values, got ${values.length}`)
  }
}

async function postMetrics(metrics: MappedMetric[]): Promise<void> {
  const errors: Error[] = []

  for (const metric of metrics) {
    try {
      const response = await postCloudIngest(metric)

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `${response.status} ${response.statusText}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(new Error(`${metric.tag}: ${message}`))
      console.error('edge5.modbus.v2.metric.failed', metric.tag, message)
    }
  }

  console.log('edge5.modbus.v2.posted', {
    total: metrics.length,
    succeeded: metrics.length - errors.length,
    failed: errors.length,
  })

  if (errors.length) {
    throw new Error(`Failed to post ${errors.length}/${metrics.length} edge5 modbus v2 metrics`)
  }
}

export const handleEdge5ModbusV2: TopicHandler = async (topic, payload) => {
  console.log('edge5.modbus.v2.received', { topic, bytes: payload.length })

  const values = parseValues(payload)
  const metrics = mapper.mapValues(values, new Date().toISOString())
  await postMetrics(metrics)
}
