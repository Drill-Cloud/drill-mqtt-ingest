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
  let value: unknown

  try {
    value = JSON.parse(payload.toString('utf8')) as unknown
  } catch {
    throw new Error(`Expected JSON number[${REGISTER_COUNT}]`)
  }

  if (
    Array.isArray(value) &&
    value.length === REGISTER_COUNT &&
    value.every((item) => typeof item === 'number' && Number.isFinite(item))
  ) {
    return value
  }

  throw new Error(`Expected JSON number[${REGISTER_COUNT}]`)
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
    console.error('edge5.modbus.post_error', {
      status: response.status,
      statusText: response.statusText,
      body: text.slice(0, 500),
    })
    return
  }

  console.log('edge5.modbus.posted', { count: metrics.length })
}

export const handleEdge5Modbus: TopicHandler = async (topic, payload) => {
  console.log('edge5.modbus.received', { topic, bytes: payload.length })

  let values: number[]

  try {
    values = parseValues(payload)
  } catch (err) {
    console.warn('edge5.modbus.invalid_payload', { topic, err })
    return
  }

  const metrics = toMetrics(values, Date.now())
  await postMetrics(metrics)
}
