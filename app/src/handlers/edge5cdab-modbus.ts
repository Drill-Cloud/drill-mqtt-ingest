import { postCloudIngest } from '../cloud-ingest.js'
import { log } from '../helpers/log.js'
import type { TopicHandler } from '../types.js'

const EDGE = 'edge5cdab'
const REGISTER_COUNT = 100

type Edge5iiModbusMetric = {
  edge: string
  timestamp: string
  tag: string
  value: number
};

function toFloatCDAB(reg0: number, reg1: number): number {
  const buf = Buffer.allocUnsafe(4)
  buf.writeUInt16BE(reg1, 0)
  buf.writeUInt16BE(reg0, 2)
  return buf.readFloatBE(0)
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

function toMetrics(values: number[], timestamp: string): Edge5iiModbusMetric[] {
  const metrics: Edge5iiModbusMetric[] = []

  for (let i = 0; i < values.length; i += 2) {
    metrics.push({
      edge: EDGE,
      timestamp,
      tag: `register-${String(i).padStart(3, '0')}`,
      value: toFloatCDAB(values[i], values[i + 1]),
    })
  }

  return metrics
}

async function postMetrics(metrics: Edge5iiModbusMetric[]): Promise<void> {
  for (const metric of metrics) {
    const response = await postCloudIngest(metric)

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text)
    }
  }

  log(`${EDGE}.modbus.posted ${metrics.length} metrics`)
}

export const handle: TopicHandler = async (topic, payload) => {
  log(`${EDGE}.modbus.received ${topic} ${payload.length} bytes`)

  const values = parseValues(payload)
  const metrics = toMetrics(values, new Date().toISOString())
  log(`${EDGE}.modbus.prepared ${JSON.stringify(metrics)}`)
  await postMetrics(metrics)
}
