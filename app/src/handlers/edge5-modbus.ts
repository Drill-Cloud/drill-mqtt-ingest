import { postCloudIngest } from '../cloud-ingest.js'
import type { TopicHandler } from '../types.js'

export const TOPIC = 'data/edge5/modbus/v1'

const EDGE = 'edge5'
const REGISTER_COUNT = 125

type Edge5ModbusMetric = {
  edge: string
  timestamp: number
  tag: string
  value: number
}

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

function toMetrics(values: number[], timestamp: number): Edge5ModbusMetric[] {
  return values.map((value, index) => ({
    edge: EDGE,
    timestamp,
    tag: `${EDGE}.modbus.${index + 1}`,
    value,
  }))
}

async function postMetrics(metrics: Edge5ModbusMetric[]): Promise<void> {
  const response = await postCloudIngest(metrics)

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }

  console.log('edge5.modbus.posted', { count: metrics.length })
}

export const handleEdge5Modbus: TopicHandler = async (topic, payload) => {
  console.log('edge5.modbus.received', { topic, bytes: payload.length })

  const values = parseValues(payload)
  const metrics = toMetrics(values, Date.now())
  await postMetrics(metrics)
}
