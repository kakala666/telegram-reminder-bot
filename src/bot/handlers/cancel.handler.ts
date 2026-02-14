import type { Bot, Context } from 'grammy'
import type { BotContext } from '../create-bot.js'

export function registerCancelHandler(bot: Bot<Context>, ctx: BotContext): void {
  bot.command('cancel', async (msgCtx) => {
    const userId = String(msgCtx.from!.id)
    const args = msgCtx.match?.toString().trim()

    if (!args) {
      await msgCtx.reply('请指定要取消的提醒编号，例如：/cancel 1')
      return
    }

    if (!/^\d+$/.test(args)) {
      await msgCtx.reply('编号格式不正确，请输入正整数，例如：/cancel 1')
      return
    }
    const id = parseInt(args, 10)

    const success = ctx.reminderService.cancel(userId, id)
    if (success) {
      await msgCtx.reply(`✅ 提醒 #${id} 已取消。`)
    } else {
      await msgCtx.reply(`未找到编号为 #${id} 的活跃提醒。`)
    }
  })
}
