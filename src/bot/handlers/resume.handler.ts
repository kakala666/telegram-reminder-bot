import type { Bot, Context } from 'grammy'
import type { BotContext } from '../create-bot.js'

export function registerResumeHandler(bot: Bot<Context>, ctx: BotContext): void {
  bot.command('resume', async (msgCtx) => {
    const userId = String(msgCtx.from!.id)
    const args = msgCtx.match?.toString().trim()

    if (!args) {
      await msgCtx.reply('请指定要恢复的提醒编号，例如：/resume 1')
      return
    }

    if (!/^\d+$/.test(args)) {
      await msgCtx.reply('编号格式不正确，请输入正整数，例如：/resume 1')
      return
    }
    const id = parseInt(args, 10)

    const success = ctx.reminderService.resume(userId, id)
    if (success) {
      await msgCtx.reply(`▶️ 提醒 #${id} 已恢复。`)
    } else {
      await msgCtx.reply(`无法恢复 #${id}。可能不存在或未处于暂停状态。`)
    }
  })
}
