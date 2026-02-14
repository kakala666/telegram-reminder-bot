import OpenAI from 'openai'
import { env } from '../config/env.js'
import { AI_TIMEOUT_MS } from '../config/constants.js'

let client: OpenAI | null = null

export function getAiClient(): OpenAI {
  if (client) return client

  client = new OpenAI({
    apiKey: env.SILICONFLOW_API_KEY,
    baseURL: env.SILICONFLOW_BASE_URL,
    timeout: AI_TIMEOUT_MS,
  })

  return client
}
