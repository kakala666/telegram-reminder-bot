import { z } from 'zod/v4'

export const aiResponseSchema = z.object({
  type: z.enum(['once', 'daily', 'weekly', 'monthly', 'weekday', 'countdown', 'not_reminder', 'parse_failed']),
  time: z.string().nullable().optional(),
  cron: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
  raw_time_text: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
})

export type AiResponse = z.infer<typeof aiResponseSchema>

export const reminderTypeEnum = z.enum(['once', 'daily', 'weekly', 'monthly', 'weekday', 'countdown'])
