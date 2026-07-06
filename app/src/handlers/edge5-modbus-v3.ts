import { postCloudIngest, postDemoCloudIngest } from '../cloud-ingest.js'
import { log } from '../helpers/log.js'
import type { TopicHandler } from '../types.js'

const EDGE = 'edge5-v3'
const REGISTER_COUNT = 24

// Фиксируем интерпретацию
const TAGS = [
  'edge5-v3-wk',
  'edge5-v3-pin',
  'edge5-v3-hk',
  'edge5-v3-mk',
  'edge5-v3-mrot',
  'edge5-v3-h',
  'edge5-v3-vw',
  'edge5-v3-pdk',
  'edge5-v3-h2s',
  'edge5-v3-t',
  'edge5-v3-nrot',
  'edge5-v3-vsp',
] as const

// из них выводим на дашборд семь виджетов
const CLOUD_INGEST_TAGS = new Set<string>([
  'edge5-v3-wk',
  'edge5-v3-hk',
  'edge5-v3-vw',
  'edge5-v3-pdk',
  'edge5-v3-h2s',
  'edge5-v3-nrot',
  'edge5-v3-vsp',
])

type Edge5ModbusV3Metric = {
  edge: string
  timestamp: string
  tag: string
  value: number | null
}

function toFloatCDAB(reg0: number, reg1: number): number | null {
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

function toMetrics(values: number[], timestamp: string): Edge5ModbusV3Metric[] {
  const metrics: Edge5ModbusV3Metric[] = []

  for (let i = 0; i < values.length; i += 2) {
    const tag = TAGS[i / 2]
    const value = toFloatCDAB(values[i], values[i + 1]); // null is possible to send

    metrics.push({
      edge: EDGE,
      timestamp,
      tag,
      value,
    })
  }

  return metrics
}

async function postMetrics(metrics: Edge5ModbusV3Metric[]): Promise<void> {
  const toPost = metrics.filter((metric) => CLOUD_INGEST_TAGS.has(metric.tag))
  const errors: Error[] = []

  for (const metric of toPost) {
    try {
      const response = await postCloudIngest(metric)

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `${response.status} ${response.statusText}`)
      }

      void postDemoCloudIngest(metric); // для демо-системы

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(new Error(`${metric.tag}: ${message}`))
      console.error('edge5.modbus.v3.metric.failed', metric.tag, message)
    }
  }

  log(`edge5.modbus.v3.data ↑ ${toPost.length} tags`);

  if (errors.length) {
    throw new Error(`Failed to post ${errors.length}/${toPost.length} edge5 modbus v3 metrics`)
  }
}

export const handleEdge5ModbusV3: TopicHandler = async (topic, payload) => {
  const timestamp = new Date().toISOString();
  const values = parseValues(payload);
  const metrics = toMetrics(values, timestamp);
  await postMetrics(metrics);
}
