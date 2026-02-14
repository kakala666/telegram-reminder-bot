import type { Bot, Context } from 'grammy'
import { logger } from '../shared/logger.js'

export function setupMiddleware(bot: Bot<Context>): void {
  bot.use(async (ctx, next) => {
    if (ctx.chat?.type !== 'private') return
    await next()
  })

  bot.catch((err) => {
    logger.error('Bot 未捕获异常', { error: err.message ?? err })
  })
}
