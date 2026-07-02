import type { TopicHandler } from '../types.js'

export const TOPIC = 'data/demo/modbus/v1'

const EDGE = 'demo'
const REGISTER_COUNT = 125
const DEMO_CLOUD_INGEST_URL = process.env.DEMO_CLOUD_INGEST_URL

type DemoModbusMetric = {
  edge: string
  timestamp: string
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

function toMetrics(values: number[], timestamp: string): DemoModbusMetric[] {
  return values.map((value, index) => ({
    edge: EDGE,
    timestamp,
    tag: `${EDGE}.modbus.${index + 1}`,
    value,
  }))
}

async function postMetrics(metrics: DemoModbusMetric[]): Promise<void> {
  for (const metric of metrics) {
    const response = await fetch(DEMO_CLOUD_INGEST_URL as string, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.CLOUD_INGEST_API_KEY as string,
      },
      body: JSON.stringify(metric),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text)
    }
  }

  console.log('demo.modbus.posted', { count: metrics.length })
}

export const handleDemoModbus: TopicHandler = async (topic, payload) => {
  console.log('demo.modbus.received', { topic, bytes: payload.length })

  const values = parseValues(payload)
  const metrics = toMetrics(values, new Date().toISOString())
  await postMetrics(metrics)
}
