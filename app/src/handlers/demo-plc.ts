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

type DemoPlcMetric = DemoPlcPayload & {
  edge: string
  timestamp: number
}

function isDemoPlcPayload(value: unknown): value is DemoPlcPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<DemoPlcPayload>

  return (
    typeof candidate.tag === 'string' &&
    candidate.tag.length > 0 &&
    typeof candidate.value === 'number' &&
    Number.isFinite(candidate.value)
  )
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
    console.error('demo.plc.post_error', {
      status: response.status,
      statusText: response.statusText,
      body: text.slice(0, 500),
    })
    return
  }

  console.log('demo.plc.posted', { tag: metric.tag })
}

export const handleDemoPlc: TopicHandler = async (topic, payload) => {
  console.log('demo.plc.received', { topic, bytes: payload.length })

  let value: unknown

  try {
    value = parseJson(payload)
  } catch (err) {
    console.warn('demo.plc.invalid_json', { topic, err })
    return
  }

  if (!isDemoPlcPayload(value)) {
    console.warn('demo.plc.invalid_payload', { topic })
    return
  }

  const metric = toMetric(value, Date.now())
  await postMetric(metric)
}
