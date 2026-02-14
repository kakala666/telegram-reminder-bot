# 项目上下文

## 目的
Telegram 个人提醒机器人，通过自然语言交互帮助用户设置和管理各类提醒（一次性、重复、倒计时、工作日）。

## 技术栈
- 运行时：Node.js >= 18 + TypeScript
- Telegram 框架：grammY
- 数据库：SQLite（better-sqlite3 或 drizzle-orm）
- 任务调度：node-cron
- 自然语言解析：硅基流动 AI API（https://api.siliconflow.cn/v1），通过 openai SDK 调用
- 部署：Docker 容器

## 项目规范

### 代码风格
- 不可变数据模式，禁止直接修改对象
- 小文件原则，单文件不超过 400 行
- 函数不超过 50 行
- 使用 ESLint + Prettier 格式化
- 命名规范：camelCase 变量/函数，PascalCase 类型/接口

### 架构模式
- 按功能/领域组织目录结构
- 单进程架构，无需分布式
- Repository 模式管理数据访问
- 服务层处理业务逻辑

### 测试策略
- TDD 驱动开发
- 单元测试覆盖核心逻辑（时间解析、调度）
- 集成测试覆盖数据库操作
- 目标覆盖率 80%+

### Git 工作流
- 常规提交格式：`<type>: <description>`
- 类型：feat, fix, refactor, docs, test, chore

## 领域上下文
- 交互语言：仅中文
- 时区：固定 Asia/Shanghai
- 用户场景：私聊模式，不支持群组
- 提醒类型：一次性、重复（每日/每周/每月）、倒计时、工作日

## 重要约束
- Bot Token 通过环境变量 `TELEGRAM_BOT_TOKEN` 注入，禁止硬编码
- AI API Key 通过环境变量 `SILICONFLOW_API_KEY` 注入，禁止硬编码
- 用户输入必须验证和清理
- SQLite 使用参数化查询
- 大模型返回的 JSON 必须经过 schema 验证后才能使用
- 进程重启后必须恢复所有未触发的提醒
- 每条用户消息均调用大模型解析，无预过滤
- 大模型系统提示词存储在代码常量中，动态注入当前时间

## 外部依赖
- Telegram Bot API（需要 Bot Token）
- 硅基流动 AI API（需要 API Key，兼容 OpenAI SDK 格式）
- Docker（部署环境）
