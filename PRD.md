# Helix Mirror - 产品需求文档 (PRD)

**版本：** 1.0  
**日期：** 2026-02-12  
**作者：** Craft (代码助手 Agent)  
**状态：** Phase 1.5 已完成

---

## 1. 文档概述

### 1.1 用途说明
本文档是 Helix Mirror 项目的完整产品需求定义，用于指导开发、测试和产品迭代。文档涵盖产品愿景、功能规格、技术架构和路线图。

### 1.2 文档结构
- 项目概述与背景
- 目标用户与场景
- 核心功能详细设计
- 数据模型与接口
- 界面与交互设计
- 技术实现方案
- 路线图与里程碑

---

## 2. 项目概述

### 2.1 背景
Matteo 使用多个 AI Agent（Main、Craft、Alpha、Helix）分别处理不同领域的任务，但这些 Agent 分布在不同渠道（飞书、Discord），信息碎片化，缺乏统一的管理和记忆共享机制。

### 2.2 目标
构建一个统一的多 Agent 管理与协同系统，实现：
- 统一视图：在一个仪表盘查看所有 Agent 的活动状态
- 智能路由：根据任务类型自动推荐合适的 Agent
- 记忆共享：跨 Agent 共享项目上下文和历史决策
- 进化追踪：可视化展示 AI 助手网络的能力成长

### 2.3 价值主张
**对用户的价值：**
- 减少在多个渠道切换的成本
- 避免重复交代背景信息
- 直观了解各 Agent 的工作状态
- 建立长期的个人 AI 助手档案

**对系统的价值：**
- 积累用户偏好数据，提升服务质量
- 形成正向反馈循环，持续优化路由准确性
- 构建可扩展的 Agent 生态系统

---

## 3. 目标用户

### 3.1 用户画像
**Matteo - 多 Agent 重度用户**
- 使用 4+ 个不同功能的 AI Agent
- 跨多个渠道（飞书、Discord）与 Agent 交互
- 关注效率，希望减少管理成本
- 技术背景，能理解和使用数据仪表盘

### 3.2 用户痛点
| 痛点 | 具体表现 | 影响程度 |
|------|----------|----------|
| 信息分散 | 需要记住哪个 Agent 在哪个渠道 | 🔴 高 |
| 重复交代 | 每次换 Agent 都要重新说明背景 | 🔴 高 |
| 缺乏全局视图 | 不知道各 Agent 的工作量和效率 | 🟡 中 |
| 历史难追溯 | 过往对话分散，难以搜索回顾 | 🟡 中 |

### 3.3 使用场景

**场景 1：每日晨间查看**
Matteo 打开 Helix Mirror，查看昨日和今日的 Agent 活动概览，快速了解各 Agent 的工作状态。

**场景 2：选择 Agent 前的决策**
Matteo 想开始一个投资分析任务，在路由输入框输入"分析特斯拉财报"，系统推荐 Alpha，他点击跳转到 Discord。

**场景 3：项目上下文切换**
Matteo 在 Craft 处讨论 Helix Mirror 开发，需要切换到 Main 处理日常任务，通过项目页面查看共享的项目信息。

---

## 4. 核心功能详细设计

### 4.1 仪表盘首页

**功能描述：**
展示今日交互统计、Agent 活跃度对比、Agent 状态卡片、最近活动列表。

**用户价值：**
- 一眼了解所有 Agent 的工作状态
- 快速判断哪些 Agent 今日活跃
- 查看最近的对话历史

**界面元素：**
```
┌─────────────────────────────────────────────┐
│  🧬 Helix Mirror                    [项目]   │
├─────────────────────────────────────────────┤
│  🎯 Agent 智能路由                           │
│  ┌──────────────────────────────────────┐   │
│  │  描述你想做什么...                   │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  📊 今日概览                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 总消息数 │ │ 活跃Agent│ │ 对话次数 │    │
│  │   50     │ │    3     │ │    9     │    │
│  └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────┤
│  📈 Agent 活跃度对比                         │
│  [柱状图：今日 vs 总计]                      │
├─────────────────────────────────────────────┤
│  🤖 Agent 状态    │    🕐 最近活动          │
│  ┌──────────────┐ │    ┌──────────────┐    │
│  │ Main         │ │    │ Alpha 投资...│    │
│  │ 今日:4 总计:5│ │    │ 9小时前      │    │
│  └──────────────┘ │    └──────────────┘    │
│  ┌──────────────┐ │    ...                 │
│  │ Craft        │ │                        │
│  └──────────────┘ │                        │
└─────────────────────────────────────────────┘
```

### 4.2 Agent 智能路由

**功能描述：**
根据用户输入的关键词，实时分析并推荐最适合的 Agent。

**匹配算法：**
```typescript
// 关键词匹配规则
ROUTING_RULES = {
  craft: {
    keywords: ['代码', '开发', 'bug', '修复', '编程', 'api', '数据库', 
               '前端', '后端', 'react', 'next', 'typescript', 'git', '部署'],
    weight: 10
  },
  alpha: {
    keywords: ['股票', '投资', '持仓', '财报', '分析', '市场', '特斯拉', 
               '理财', '基金', '加密货币'],
    weight: 10
  },
  main: {
    keywords: ['任务', '日程', '安排', '提醒', '待办', '会议', '飞书', 
               '配置', '设置', '日常'],
    weight: 10
  }
}

// 计分逻辑：匹配词频 + 词位置（开头加分）
score = sum(matched_keywords * 10) + bonus_keywords_at_start
```

**用户价值：**
- 降低选择 Agent 的认知负担
- 快速跳转到正确渠道
- 发现 Agent 的能力边界

### 4.3 项目记忆层

**功能描述：**
创建和管理跨 Agent 共享的项目上下文。

**数据模型：**
```typescript
interface Project {
  id: number;
  name: string;           // 项目名称
  description: string;    // 项目描述
  status: 'active' | 'paused' | 'completed';
  agentIds: string[];     // 关联的 Agent ID 列表
  createdAt: Date;
  updatedAt: Date;
}
```

**用户价值：**
- 跨 Agent 共享项目背景
- 追踪项目参与情况
- 避免重复介绍项目

**使用流程：**
1. 创建项目："Helix Mirror 开发"
2. 关联 Agent：Craft（代码）、Main（协调）
3. 各 Agent 可查看项目信息
4. 项目状态随进展更新

### 4.4 数据同步机制

**功能描述：**
将 OpenClaw 的真实对话数据导入 Helix Mirror 数据库。

**实现方案：**
```bash
# 手动同步脚本
node scripts/sync-data.js [agent_id] [channel] "消息预览" [消息数]

# 批量导入演示数据
node scripts/sync-data.js --demo

# API 端点
POST /api/interactions
GET  /api/interactions?limit=10
```

**扩展计划（Phase 2）：**
- 自动读取 OpenClaw workspace 日志文件
- 定时同步任务
- 实时 webhook 接收

---

## 5. 数据模型

### 5.1 数据库表结构

**agents 表 - Agent 元信息**
```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY,        -- 唯一标识：main, craft, alpha, helix
  name TEXT NOT NULL,         -- 显示名称
  role TEXT NOT NULL,         -- 角色描述
  description TEXT,           -- 详细描述
  channel TEXT,               -- 所在渠道：Discord/飞书
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**interactions 表 - 交互记录（核心数据）**
```sql
CREATE TABLE interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,     -- 关联 Agent
  channel TEXT NOT NULL,      -- 对话渠道
  message_preview TEXT,       -- 消息预览（前100字）
  message_count INTEGER DEFAULT 1,  -- 消息条数
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- 索引优化时间查询
CREATE INDEX idx_interactions_time 
ON interactions(agent_id, created_at);
```

**projects 表 - 项目记忆**
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',  -- active/paused/completed
  agent_ids TEXT,                -- JSON 数组
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 数据流向

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   OpenClaw      │     │  Helix Mirror   │     │     用户        │
│   (各渠道)      │────▶│   (数据库)      │────▶│   (仪表盘)      │
│                 │同步 │                 │查询 │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                              │
        │              ┌─────────────────┐            │
        └─────────────▶│  sync-data.js   │◀───────────┘
                       │  (手动/API)     │
                       └─────────────────┘
```

---

## 6. 界面与交互设计

### 6.1 页面结构

**首页 (/)**
- 顶部导航：Logo + 项目入口 + 日期
- Agent 智能路由模块
- 今日概览统计卡片（3个）
- Agent 活跃度图表
- Agent 状态卡片网格（2x2）
- 最近活动列表（侧边栏）

**项目页 (/projects)**
- 返回导航 + 页面标题
- 项目统计（总数/进行中）
- 项目卡片网格
- 空状态提示

### 6.2 设计系统

**颜色方案：**
- 主背景：gray-900 (#111827)
- 卡片背景：gray-800 (#1f2937)
- 主文字：white
- 次要文字：gray-400 (#9ca3af)
- Agent 主题色：
  - Main: purple (紫色)
  - Craft: blue (蓝色)
  - Alpha: green (绿色)
  - Helix: gray (灰色)

**间距系统：**
- 页面内边距：px-4 sm:px-6 lg:px-8
- 模块间距：mb-8
- 卡片内边距：p-5
- 网格间隙：gap-4 / gap-6 / gap-8

**圆角规范：**
- 卡片：rounded-lg
- 按钮：rounded-lg
- 标签：rounded

### 6.3 响应式断点

| 断点 | 宽度 | 布局变化 |
|------|------|----------|
| 默认 | <640px | 单列堆叠 |
| sm | ≥640px | 统计卡片 3列 |
| md | ≥768px | Agent 卡片 2列 |
| lg | ≥1024px | 侧边栏显示 |

---

## 7. 技术实现方案

### 7.1 技术栈选型

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 前端框架 | Next.js 15 | SSR 支持、React 19、文件路由 |
| 样式 | Tailwind CSS | 快速开发、设计系统一致 |
| 图表 | Recharts | React 友好、可定制 |
| 数据库 | SQLite | 零配置、本地优先、轻量 |
| ORM | better-sqlite3 | 同步 API、性能好 |
| 语言 | TypeScript | 类型安全、可维护 |

### 7.2 架构模式

**服务端组件优先：**
- 数据查询在服务端完成
- 减少客户端 JS 体积
- 更好的首屏性能

**客户端组件：**
- AgentRouter（需要用户输入交互）
- AgentActivityChart（需要 Recharts 浏览器环境）

**数据流：**
```
Page (Server) → Queries → SQLite
                    ↓
            Components → Props
                    ↓
              Client Hydration
```

### 7.3 项目结构

```
helix-mirror/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 首页（仪表盘）
│   │   ├── projects/          # 项目页面
│   │   │   └── page.tsx
│   │   ├── api/               # API 路由
│   │   │   └── interactions/
│   │   │       └── route.ts
│   │   ├── layout.tsx         # 根布局
│   │   └── globals.css        # 全局样式
│   ├── components/            # React 组件
│   │   ├── AgentCard.tsx
│   │   ├── AgentRouter.tsx
│   │   ├── AgentActivityChart.tsx
│   │   ├── StatCard.tsx
│   │   ├── ActivityList.tsx
│   │   └── ProjectCard.tsx
│   └── lib/                   # 工具函数
│       ├── db.ts              # 数据库连接
│       ├── queries.ts         # 数据查询
│       └── projects.ts        # 项目数据层
├── scripts/
│   └── sync-data.js           # 数据同步脚本
├── data/
│   └── helix.db               # SQLite 数据库
└── SPEC.md / PRD.md           # 产品文档
```

---

## 8. 路线图与里程碑

### Phase 1 - MVP（已完成 ✅）
**目标：** 基础仪表盘可用
- ✅ 透明代理层（数据记录）
- ✅ Web 仪表盘（首页展示）
- ✅ 基础数据库和查询
- ✅ 构建和部署流程

### Phase 1.5 - 实用化（已完成 ✅）
**目标：** 从演示到实用
- ✅ 修复语法错误
- ✅ 数据同步脚本
- ✅ Agent 智能路由
- ✅ 项目记忆层框架
- ✅ API 接口

### Phase 2 - 智能化（规划中）
**目标：** 自动数据同步 + 意图识别
- [ ] 自动读取 OpenClaw 日志
- [ ] 定时同步任务
- [ ] 简单 NLP 意图分类
- [ ] 路由准确率统计
- [ ] 数据导出功能

### Phase 3 - 云端化（规划中）
**目标：** 远程访问 + 移动端
- [ ] 迁移到 Supabase
- [ ] Vercel 部署
- [ ] 移动端适配
- [ ] 用户认证

### Phase 4 - 进化看板（未来愿景）
**目标：** AI 助手网络的可视化进化
- [ ] Agent 能力成长曲线
- [ ] 效率提升统计
- [ ] 个人 AI 助手档案
- [ ] 进化报告自动生成

---

## 9. 成功指标

### 9.1 定量指标

| 指标 | 当前值 | Phase 2 目标 | Phase 3 目标 |
|------|--------|-------------|-------------|
| 数据准确性 | 演示数据 | 真实数据覆盖 80% | 100% 真实数据 |
| 路由准确率 | 关键词匹配 | 70% 推荐正确 | 85% 推荐正确 |
| 页面加载时间 | <2s | <1.5s | <1s |
| 日活跃用户 | 1 (Matteo) | 1 | 待定 |

### 9.2 定性指标

- **使用频率：** Matteo 每日至少查看一次仪表盘
- **任务完成率：** 通过路由推荐的 Agent 成功完成任务的比例
- **用户满意度：** 减少渠道切换的挫败感

---

## 10. 风险与假设

### 10.1 风险识别

| 风险 | 影响 | 概率 | 应对策略 |
|------|------|------|----------|
| OpenClaw 日志格式变化 | 高 | 中 | 封装数据读取层，便于适配 |
| better-sqlite3 构建问题 | 中 | 低 | 提供 Docker 方案 |
| 用户不想手动同步数据 | 高 | 高 | 优先开发自动同步 |

### 10.2 关键假设

1. **假设：** Matteo 愿意定期运行同步脚本
   **验证：** Phase 1.5 发布后观察使用情况

2. **假设：** 关键词路由足够满足需求
   **验证：** 观察路由使用率，必要时升级到 NLP

3. **假设：** 本地 SQLite 足够长期使用
   **验证：** 数据量增长后评估性能

---

## 11. 附录

### 11.1 术语表

| 术语 | 定义 |
|------|------|
| Agent | AI 助手，如 Main、Craft、Alpha、Helix |
| 渠道 | 对话平台，如飞书、Discord |
| 路由 | 根据输入推荐合适的 Agent |
| 记忆层 | 跨 Agent 共享的上下文信息 |

### 11.2 参考资料

- SPEC.md - 原始产品规格
- README.md - 项目说明
- OpenClaw 文档 - 数据来源

### 11.3 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| 1.0 | 2026-02-12 | 初始版本 | Craft |

---

**文档结束**

*本文档是 Helix Mirror 产品的完整需求定义，开发过程中如遇到规格不清或需要调整的地方，应及时更新本文档。*
