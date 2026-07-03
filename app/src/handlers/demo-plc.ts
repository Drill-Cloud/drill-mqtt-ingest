import { log } from '../helpers/log.js'
import { parseJson } from '../helpers/parse.js'
import type { TopicHandler } from '../types.js'

const EDGE = 'demo'
const DEMO_CLOUD_INGEST_URL = process.env.DEMO_CLOUD_INGEST_URL as string

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
  const response = await fetch(DEMO_CLOUD_INGEST_URL, {
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

  log('demo.plc.posted', { tag: metric.tag })
}

export const handleDemoPlc: TopicHandler = async (topic, payload) => {
  log('demo.plc.received', { topic, bytes: payload.length })

  const value = parseJson<DemoPlcPayload>(payload)
  const metric = toMetric(value, new Date().toISOString())
  await postMetric(metric)
}
