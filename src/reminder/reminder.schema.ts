import { z } from 'zod/v4'

export const aiResponseSchema = z.object({
  type: z.enum(['once', 'daily', 'weekly', 'monthly', 'weekday', 'countdown', 'not_reminder', 'parse_failed']),
  time: z.string().optional(),
  cron: z.string().optional(),
  content: z.string().optional(),
  confidence: z.number().min(0).max(1),
  raw_time_text: z.string().optional(),
  reason: z.string().optional(),
})

export type AiResponse = z.infer<typeof aiResponseSchema>

export const reminderTypeEnum = z.enum(['once', 'daily', 'weekly', 'monthly', 'weekday', 'countdown'])
