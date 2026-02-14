export type ReminderType = 'once' | 'daily' | 'weekly' | 'monthly' | 'weekday' | 'countdown'

export type ReminderStatus = 'active' | 'paused' | 'cancelled' | 'completed' | 'firing'

export interface Reminder {
  readonly id: number
  readonly userId: string
  readonly chatId: string
  readonly type: ReminderType
  readonly status: ReminderStatus
  readonly content: string
  readonly sourceText: string
  readonly rawTimeText: string | null
  readonly aiConfidence: number | null
  readonly cronExpr: string | null
  readonly nextRunAt: number
  readonly lastRunAt: number | null
  readonly runCount: number
  readonly createdAt: number
  readonly updatedAt: number
}

export interface CreateReminderInput {
  readonly userId: string
  readonly chatId: string
  readonly type: ReminderType
  readonly content: string
  readonly sourceText: string
  readonly rawTimeText: string | null
  readonly aiConfidence: number | null
  readonly cronExpr: string | null
  readonly nextRunAt: number
}
