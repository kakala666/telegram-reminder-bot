import type { Bot, Context } from 'grammy'
import type { BotContext } from '../create-bot.js'
import { registerStartHandler } from './start.handler.js'
import { registerHelpHandler } from './help.handler.js'
import { registerListHandler } from './list.handler.js'
import { registerCancelHandler } from './cancel.handler.js'
import { registerPauseHandler } from './pause.handler.js'
import { registerResumeHandler } from './resume.handler.js'
import { registerMessageHandler } from './message.handler.js'

export function registerHandlers(bot: Bot<Context>, ctx: BotContext): void {
  registerStartHandler(bot)
  registerHelpHandler(bot)
  registerListHandler(bot, ctx)
  registerCancelHandler(bot, ctx)
  registerPauseHandler(bot, ctx)
  registerResumeHandler(bot, ctx)
  registerMessageHandler(bot, ctx)
}
