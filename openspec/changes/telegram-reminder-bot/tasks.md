# Telegram 提醒机器人 - 实施任务

## 阶段一：项目脚手架

### T1: 初始化项目
- 初始化 npm 项目，配置 TypeScript
- 安装依赖：grammy, better-sqlite3, node-cron, openai, zod, dotenv
- 安装开发依赖：typescript, @types/better-sqlite3, @types/node, vitest
- 配置 tsconfig.json, .gitignore, .env.example
- 验收：`npm run build` 成功

### T2: 基础配置模块
- 实现 src/config/env.ts：环境变量加载与 zod 验证
- 实现 src/config/constants.ts：时区、置信度阈值等常量
- 实现 src/shared/logger.ts：日志工具
- 实现 src/shared/errors.ts：自定义错误类型
- 验收：配置加载测试通过

## 阶段二：数据层

### T3: 数据库连接与迁移
- 实现 src/db/connection.ts：SQLite 连接管理（WAL 模式、busy_timeout）
- 实现 src/db/migrations.ts：建表语句、索引
- 启动时自动执行迁移
- 验收：启动后 reminders 表存在，PRAGMA 设置正确

### T4: Repository 层
- 实现 src/reminder/reminder.types.ts：类型定义
- 实现 src/reminder/reminder.schema.ts：zod schema
- 实现 src/reminder/reminder.repository.ts：CRUD 操作
  - create(reminder) → Reminder
  - findDue(now, limit) → Reminder[]
  - findByUser(userId) → Reminder[]
  - updateStatus(id, status) → void
  - updateNextRun(id, nextRunAt) → void
  - claimFiring(ids) → number
- 验收：Repository 单元测试通过

## 阶段三：AI 集成

### T5: AI 客户端与系统提示词
- 实现 src/ai/client.ts：OpenAI SDK 封装（指向硅基流动）
- 实现 src/ai/prompts.ts：系统提示词常量（含动态时间注入）
- 实现 src/ai/parse-reminder.ts：调用大模型 + JSON 解析 + zod 验证
- 错误处理：超时、API 错误、JSON 解析失败、schema 验证失败
- 验收：mock 测试通过，真实 API 调用测试通过

## 阶段四：业务逻辑

### T6: 提醒服务
- 实现 src/reminder/reminder.service.ts：
  - createFromAiResult(userId, chatId, sourceText, aiResult) → Reminder
  - listActive(userId) → Reminder[]
  - cancel(userId, id) → boolean
  - pause(userId, id) → boolean
  - resume(userId, id) → boolean
- 时间计算：cron 表达式 → next_run_at，倒计时 → 绝对时间
- 验收：服务层单元测试通过

### T7: 调度器与恢复
- 实现 src/reminder/reminder.scheduler.ts：
  - 每 10 秒轮询到期提醒
  - 事务认领（active → firing）
  - 发送 Telegram 消息
  - 更新状态（completed / 计算下一次 next_run_at）
- 实现 src/reminder/reminder.recovery.ts：
  - 启动恢复：firing → active
  - 过期一次性提醒处理（补发/跳过）
  - 重复提醒滚动 next_run_at
- 验收：调度测试通过，恢复测试通过

## 阶段五：Bot 集成

### T8: Bot 框架搭建
- 实现 src/bot/create-bot.ts：Bot 实例创建
- 实现 src/bot/middleware.ts：私聊过滤、错误兜底
- 实现 src/bot/handlers/start.handler.ts：/start 欢迎消息
- 实现 src/bot/handlers/help.handler.ts：/help 使用帮助
- 验收：Bot 启动，/start 和 /help 响应正常

### T9: 消息处理与命令
- 实现 src/bot/handlers/message.handler.ts：自然语言 → AI 解析 → 创建提醒
- 实现 src/bot/handlers/list.handler.ts：/list 查看提醒
- 实现 src/bot/handlers/cancel.handler.ts：/cancel 取消提醒
- 实现 src/bot/handlers/pause.handler.ts：/pause 暂停提醒
- 实现 src/bot/handlers/resume.handler.ts：/resume 恢复提醒
- 验收：所有命令功能测试通过

## 阶段六：入口与部署

### T10: 应用入口
- 实现 src/index.ts：
  - 加载配置
  - 初始化数据库
  - 执行启动恢复
  - 创建并启动 Bot
  - 启动调度器
  - 优雅退出处理（SIGINT/SIGTERM）
- 验收：完整启动流程正常

### T11: Docker 部署
- 编写 Dockerfile（多阶段构建）
- 编写 docker-compose.yml
- 配置数据卷挂载
- 验收：`docker compose up` 正常运行

## 任务依赖

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11
                      ↘           ↗
                       T5 → T6
```

T1-T4 为串行基础链，T5 可与 T4 并行开发，T6 依赖 T4+T5，T7-T11 串行。
