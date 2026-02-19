# Helix Mirror

Helix Mirror 是一个本地优先的多 Agent 观察与路由仪表盘，聚合 Main/Craft/Alpha/Helix 的交互数据并提供项目上下文管理。

## 当前版本

- App version: `0.5.0`
- Next.js: `14.2.29`
- Node.js: `20.x`

## 已实现功能

- 仪表盘首页：今日统计、Agent 活跃度、最近活动
- 关键词路由：输入任务后推荐匹配 Agent
- 项目记忆层：项目列表、状态展示
- 数据存储：SQLite（`data/helix.db`）
- 数据写入 API：`/api/interactions`、`/api/projects`

## 快速开始

1. 安装依赖：`npm install`
2. 配置环境变量：复制 `.env.example` 为 `.env.local`
3. 启动开发环境：`npm run dev`
4. 打开：`http://localhost:3000`

## 常用命令

- `npm run dev` 本地开发
- `npm run typecheck` TypeScript 校验
- `npm run lint` ESLint
- `npm run build` 生产构建

## API 概览

- `GET /api/interactions?limit=10`
- `POST /api/interactions`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `GET /api/routing-logs`
- `POST /api/routing-logs`

## 说明

- 开发环境（`NODE_ENV=development`）下 API 默认跳过 token 校验。
- 生产环境下需要配置 `API_TOKEN` 并使用 `Authorization: Bearer <token>`。
