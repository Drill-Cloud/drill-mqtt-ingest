import { postCloudIngest } from '../cloud-ingest.js'
import { parseJson } from '../helpers/parse.js'
import type { TopicHandler } from '../types.js'

const EDGE = 'demo'

type DemoPlcPayload = {
  tag: string
  value: number
}

type DemoPlcMetric = {
  edge: string
  timestamp: string
  tag: string
  value: number
}

function toMetric(payload: DemoPlcPayload, timestamp: string): DemoPlcMetric {
  return {
    edge: EDGE,
    timestamp,
    tag: payload.tag,
    value: payload.value,
  }
}

async function postMetric(metric: DemoPlcMetric): Promise<void> {
  const response = await postCloudIngest(metric)

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }

  console.log('demo.plc.posted', { tag: metric.tag })
}

export const handleDemoPlc: TopicHandler = async (topic, payload) => {
  console.log('demo.plc.received', { topic, bytes: payload.length })

  const value = parseJson<DemoPlcPayload>(payload)
  const metric = toMetric(value, new Date().toISOString())
  await postMetric(metric)
}
