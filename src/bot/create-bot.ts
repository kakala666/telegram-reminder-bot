import { Bot } from 'grammy'
import { env } from '../config/env.js'
import { setupMiddleware } from './middleware.js'
import { registerHandlers } from './handlers/index.js'
import type { ReminderService } from '../reminder/reminder.service.js'

export interface BotContext {
  readonly reminderService: ReminderService
}

export function createBot(ctx: BotContext): Bot {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN)

  setupMiddleware(bot)
  registerHandlers(bot, ctx)

  return bot
}
