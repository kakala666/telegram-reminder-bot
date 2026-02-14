import type { Bot, Context } from 'grammy'
import type { BotContext } from '../create-bot.js'

export function registerPauseHandler(bot: Bot<Context>, ctx: BotContext): void {
  bot.command('pause', async (msgCtx) => {
    const userId = String(msgCtx.from!.id)
    const args = msgCtx.match?.toString().trim()

    if (!args) {
      await msgCtx.reply('请指定要暂停的提醒编号，例如：/pause 1')
      return
    }

    if (!/^\d+$/.test(args)) {
      await msgCtx.reply('编号格式不正确，请输入正整数，例如：/pause 1')
      return
    }
    const id = parseInt(args, 10)

    const success = ctx.reminderService.pause(userId, id)
    if (success) {
      await msgCtx.reply(`⏸️ 提醒 #${id} 已暂停。使用 /resume ${id} 恢复。`)
    } else {
      await msgCtx.reply(`无法暂停 #${id}。可能不存在、已暂停或是一次性提醒。`)
    }
  })
}
