import { getAiClient } from './client.js'
import { buildSystemPrompt } from './prompts.js'
import { aiResponseSchema, type AiResponse } from '../reminder/reminder.schema.js'
import { env } from '../config/env.js'
import { AiParseError, AiTimeoutError } from '../shared/errors.js'
import { logger } from '../shared/logger.js'

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1]!.trim()

  const braceMatch = text.match(/\{[\s\S]*\}/)
  if (braceMatch) return braceMatch[0]

  return text.trim()
}

export async function parseReminder(userMessage: string): Promise<AiResponse> {
  const client = getAiClient()
  const systemPrompt = buildSystemPrompt()

  try {
    const response = await client.chat.completions.create({
      model: env.SILICONFLOW_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) {
      throw new AiParseError('大模型返回空内容')
    }

    logger.debug('AI 原始返回', { raw })

    const jsonStr = extractJson(raw)
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      throw new AiParseError(`JSON 解析失败: ${jsonStr.slice(0, 200)}`)
    }

    const validated = aiResponseSchema.safeParse(parsed)
    if (!validated.success) {
      throw new AiParseError(`Schema 验证失败: ${JSON.stringify(validated.error.issues)}`)
    }

    return validated.data
  } catch (err) {
    if (err instanceof AiParseError) throw err

    if (err instanceof Error && err.message.includes('timeout')) {
      throw new AiTimeoutError(err)
    }

    throw new AiParseError('AI 调用失败', err)
  }
}
