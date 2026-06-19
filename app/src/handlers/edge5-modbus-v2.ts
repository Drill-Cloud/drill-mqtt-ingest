import { postCloudIngest } from '../cloud-ingest.js'
import { createMetricMapper, type MappedMetric } from '../mapping.js'
import type { TopicHandler } from '../types.js'

export const TOPIC = 'data/edge5/modbus/v2'

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
