import { log } from '../helpers/log.js'
import { parseJson } from '../helpers/parse.js'
import type { TopicHandler } from '../types.js'

const EDGE = 'dev';
const CLOUD_INGEST_URL = process.env.CLOUD_INGEST_URL as string;

type InputPayload = {
  [tag: string]: number
}

type OutputPayload = {
  edge: string
  timestamp: string
  tag: string
  value: number | null
};

function inputToOutput(payload: InputPayload, timestamp: string): OutputPayload[] {
  return Object.entries(payload).map(([tag, value]) => ({
    edge: EDGE,
    timestamp,
    tag,
    value,
  }))
}

async function post(payload: OutputPayload[]): Promise<void> {
  for (const item of payload) {
    const response = await fetch(CLOUD_INGEST_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.CLOUD_INGEST_API_KEY as string,
      },
      body: JSON.stringify(item),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text)
    }
  }

  log('dev.modbus.v3.posted', { count: payload.length })
}

export const handleDevModbusV3: TopicHandler = async (topic, payload) => {
  log('dev.modbus.v3.received', { topic, bytes: payload.length })

  const value = parseJson<InputPayload>(payload)
  const metric = inputToOutput(value, new Date().toISOString())
  await post(metric)
}
