import { parseJson } from '../helpers/parse.js'
import type { TopicHandler } from '../types.js'

export const TOPIC = 'data/demo/plc/v1'

const EDGE = 'demo'
const postUrl =
  process.env.CLOUD_INGEST_URL ?? 'https://demo.backend.drill.greact.ru/ingest'

type DemoPlcPayload = {
  tag: string
  value: number
}

type DemoPlcMetric = {
  edge: string
  timestamp: number
  tag: string
  value: number
}

function toMetric(payload: DemoPlcPayload, timestamp: number): DemoPlcMetric {
  return {
    edge: EDGE,
    timestamp,
    tag: payload.tag,
    value: payload.value,
  }
}

async function postMetric(metric: DemoPlcMetric): Promise<void> {
  const response = await fetch(postUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(metric),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }

  console.log('demo.plc.posted', { tag: metric.tag })
}

export const handleDemoPlc: TopicHandler = async (topic, payload) => {
  console.log('demo.plc.received', { topic, bytes: payload.length })

  const value = parseJson<DemoPlcPayload>(payload)
  const metric = toMetric(value, Date.now())
  await postMetric(metric)
}
