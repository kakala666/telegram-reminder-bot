import type { ReminderRepository } from './reminder.repository.js'
import type { Reminder, CreateReminderInput, ReminderType } from './reminder.types.js'
import type { AiResponse } from './reminder.schema.js'
import { nowMs, computeNextCronRun, validateCronExpr } from '../shared/time.js'
import { AppError } from '../shared/errors.js'

function computeNextRunAt(type: ReminderType, aiResult: AiResponse): number {
  if (type === 'once' || type === 'countdown') {
    if (!aiResult.time) throw new AppError('缺少触发时间', 'MISSING_TIME')
    const ts = new Date(aiResult.time).getTime()
    if (isNaN(ts)) throw new AppError('无效的时间格式', 'INVALID_TIME')
    if (ts <= nowMs()) throw new AppError('提醒时间已过，请设置未来的时间', 'PAST_TIME')
    return ts
  }

  if (!aiResult.cron) throw new AppError('缺少 cron 表达式', 'MISSING_CRON')
  validateCronExpr(aiResult.cron)
  return computeNextCronRun(aiResult.cron, nowMs())
}

export function createReminderService(repo: ReminderRepository) {
  return {
    createFromAiResult(
      userId: string,
      chatId: string,
      sourceText: string,
      aiResult: AiResponse,
    ): Reminder {
      const type = aiResult.type as ReminderType
      const nextRunAt = computeNextRunAt(type, aiResult)

      const input: CreateReminderInput = {
        userId,
        chatId,
        type,
        content: aiResult.content ?? sourceText,
        sourceText,
        rawTimeText: aiResult.raw_time_text ?? null,
        aiConfidence: aiResult.confidence,
        cronExpr: aiResult.cron ?? null,
        nextRunAt,
      }

      return repo.create(input)
    },

    listActive(userId: string): Reminder[] {
      return repo.findByUser(userId)
    },

    cancel(userId: string, id: number): boolean {
      const reminder = repo.findById(id, userId)
      if (!reminder) return false
      if (reminder.status === 'cancelled' || reminder.status === 'completed') return false
      repo.updateStatus(id, 'cancelled')
      return true
    },

    pause(userId: string, id: number): boolean {
      const reminder = repo.findById(id, userId)
      if (!reminder) return false
      if (reminder.status !== 'active') return false
      if (reminder.type === 'once' || reminder.type === 'countdown') return false
      repo.updateStatus(id, 'paused')
      return true
    },

    resume(userId: string, id: number): boolean {
      const reminder = repo.findById(id, userId)
      if (!reminder) return false
      if (reminder.status !== 'paused') return false
      repo.updateStatus(id, 'active')
      return true
    },
  }
}

export type ReminderService = ReturnType<typeof createReminderService>
