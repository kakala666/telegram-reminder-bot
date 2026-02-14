import type { Bot, Context } from 'grammy'

const WELCOME = `你好！我是你的提醒助手 🤖

直接发消息给我就能设置提醒，比如：
• "明天下午3点提醒我开会"
• "每天早上8点提醒我喝水"
• "30分钟后提醒我回电话"

输入 /help 查看更多用法。`

export function registerStartHandler(bot: Bot<Context>): void {
  bot.command('start', async (ctx) => {
    await ctx.reply(WELCOME)
  })
}
