/**
 * Prisma Seed Script
 * 
 * 使用方法：
 *   npx prisma db seed
 * 
 * 或手动运行：
 *   node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始导入数据...');

  // 导入 Agents
  const agents = [
  {
    "agentId": "main",
    "name": "Main",
    "role": "主助手",
    "description": "OpenClaw 主渠道，日常对话和任务协调",
    "channel": "飞书",
    "createdAt": "2026-02-11 07:05:02"
  },
  {
    "agentId": "craft",
    "name": "Craft",
    "role": "代码助手",
    "description": "编程和技术开发相关",
    "channel": "Discord",
    "createdAt": "2026-02-11 07:05:02"
  },
  {
    "agentId": "alpha",
    "name": "Alpha",
    "role": "投资助手",
    "description": "投资组合和市场分析",
    "channel": "Discord",
    "createdAt": "2026-02-11 07:05:02"
  },
  {
    "agentId": "helix",
    "name": "Helix",
    "role": "Discord助手",
    "description": "Discord 通用助手",
    "channel": "Discord",
    "createdAt": "2026-02-11 07:05:02"
  }
];
  
  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { agentId: agent.agentId },
      update: agent,
      create: agent,
    });
  }
  console.log(`✅ 导入 ${agents.length} 个 Agents`);

  // 导入 Interactions
  const interactions = [
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "🎉 **飞书通了！** 我看到你从飞书发过来的图片了，网络问题解决了。",
    "messageCount": 3,
    "createdAt": "2026-02-03T17:13:24.098Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "收到！👍",
    "messageCount": 1,
    "createdAt": "2026-02-03T17:35:50.631Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "能收到！✅",
    "messageCount": 2,
    "createdAt": "2026-02-03T18:49:44.412Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "嗯，我看完这份文档了。很有意思的Agent架构演化思路——从v0的\"极简主义\"到v3的\"专业化分工\"，但核心理念一直没变：**循环 + 工具调用 = Agent**。",
    "messageCount": 1,
    "createdAt": "2026-02-04T01:09:50.688Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "我收到了你的语音消息！但我**暂时无法转录**，因为我还没有配置 ASR（语音转文字）工具。",
    "messageCount": 2,
    "createdAt": "2026-02-04T09:56:07.137Z"
  },
  {
    "agentId": "alpha",
    "channel": "Discord",
    "messagePreview": "持仓分析和市场观察",
    "messageCount": 6,
    "createdAt": "2026-02-10 07:05:02"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "日常任务处理和日程安排",
    "messageCount": 4,
    "createdAt": "2026-02-10 07:05:02"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "在线呢 👋",
    "messageCount": 1,
    "createdAt": "2026-02-10T06:03:17.721Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "我是 Helix 🧬，一个 AI 助手。",
    "messageCount": 4,
    "createdAt": "2026-02-10T17:19:48.319Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "Memory 日志里记录了这几天的关键事件：",
    "messageCount": 4,
    "createdAt": "2026-02-10T17:37:57.998Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "让我检查一下状态：",
    "messageCount": 4,
    "createdAt": "2026-02-10T17:50:02.233Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "诚实回答：",
    "messageCount": 1,
    "createdAt": "2026-02-10T17:57:06.880Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "是的，这个设计挺合理的 👍",
    "messageCount": 3,
    "createdAt": "2026-02-10T18:04:15.767Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "你是在说消息有延迟吗？还是发了我没回复？",
    "messageCount": 5,
    "createdAt": "2026-02-10T18:10:00.308Z"
  },
  {
    "agentId": "craft",
    "channel": "Discord",
    "messagePreview": "讨论 Helix Mirror 架构设计",
    "messageCount": 5,
    "createdAt": "2026-02-11 03:05:02"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "复盘系统搭建和需求确认",
    "messageCount": 8,
    "createdAt": "2026-02-11 04:05:02"
  },
  {
    "agentId": "craft",
    "channel": "Discord",
    "messagePreview": "初始化 Helix Mirror 项目",
    "messageCount": 12,
    "createdAt": "2026-02-11 05:05:02"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "配置自动审批和权限设置",
    "messageCount": 3,
    "createdAt": "2026-02-11 06:35:02"
  },
  {
    "agentId": "craft",
    "channel": "Discord",
    "messagePreview": "完成 Helix Mirror Phase 1.5 开发",
    "messageCount": 8,
    "createdAt": "2026-02-11 12:48:52"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "配置飞书 Bridge 自动同步",
    "messageCount": 5,
    "createdAt": "2026-02-11 12:48:52"
  },
  {
    "agentId": "alpha",
    "channel": "Discord",
    "messagePreview": "分析特斯拉财报数据",
    "messageCount": 3,
    "createdAt": "2026-02-11 12:48:52"
  },
  {
    "agentId": "craft",
    "channel": "Discord",
    "messagePreview": "修复 ActivityList 语法错误",
    "messageCount": 2,
    "createdAt": "2026-02-11 12:48:52"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "设置定时健康检查",
    "messageCount": 4,
    "createdAt": "2026-02-11 12:48:52"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "这是一个很有意思的长期任务。让我先了解一下现状，然后帮你设置好。",
    "messageCount": 6,
    "createdAt": "2026-02-11T04:28:04.591Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "我先看看 shared memo 的现状，然后把这个 idea 写进去。",
    "messageCount": 3,
    "createdAt": "2026-02-11T04:39:45.011Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "好的，我来把 Helix Mirror 的创意发给 Craft。我先看看他的 session 状态。",
    "messageCount": 5,
    "createdAt": "2026-02-11T05:09:27.879Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "Craft 也需要唤醒——你直接在 Discord 上发一条消息给 @code_buddy，他就会回复你。",
    "messageCount": 1,
    "createdAt": "2026-02-11T05:16:53.365Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "我来帮你设置。你写的是 `sutoApprove`，应该是 `autoApprove` 的笔误吧？",
    "messageCount": 2,
    "createdAt": "2026-02-11T05:27:20.292Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "✅ **已完成**",
    "messageCount": 1,
    "createdAt": "2026-02-11T05:34:42.570Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "让我验证一下配置是否真的生效了：",
    "messageCount": 2,
    "createdAt": "2026-02-11T06:00:39.587Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "✅ **已完成**",
    "messageCount": 1,
    "createdAt": "2026-02-11T06:37:39.064Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "读完了，这篇分析很到位。",
    "messageCount": 1,
    "createdAt": "2026-02-11T06:53:37.226Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "我检查一下 Discord 的连接状态。",
    "messageCount": 3,
    "createdAt": "2026-02-11T07:12:27.508Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "抱歉，刚才是图片内容，我现在发给你：",
    "messageCount": 2,
    "createdAt": "2026-02-11T08:38:37.568Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "找到了！Claude Code 确实已下载在 `~/.claude/downloads/claude-2.1.29-darwin-arm64`，但没有添加到系统 PATH。",
    "messageCount": 2,
    "createdAt": "2026-02-11T09:17:44.806Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "我检查一下 Discord 和 Craft 的状态。",
    "messageCount": 2,
    "createdAt": "2026-02-11T14:59:26.444Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "已发送。",
    "messageCount": 1,
    "createdAt": "2026-02-11T17:52:05.378Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "✅ 已保存到 `shared-memo/2026-02-11-daily-review.md`",
    "messageCount": 3,
    "createdAt": "2026-02-11T18:06:47.634Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "HEARTBEAT.md 是空的，目前没配置自动检查任务。让我读取健康检查技能，帮你做一次系统健康检查。",
    "messageCount": 4,
    "createdAt": "2026-02-12T01:15:21.462Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "---",
    "messageCount": 1,
    "createdAt": "2026-02-12T01:21:25.236Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "## 反向代理简单解释",
    "messageCount": 3,
    "createdAt": "2026-02-12T01:54:01.383Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "没有，我还在。npm 更新被中断了（超时被杀掉）。让我检查当前状态：",
    "messageCount": 2,
    "createdAt": "2026-02-12T03:37:03.513Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "看不到，每个 agent 的会话是独立的。让我检查一下：",
    "messageCount": 2,
    "createdAt": "2026-02-12T05:03:51.713Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "我看到消息被截断了，但大概明白你们在讨论 **Claude Code 的使用方式**。",
    "messageCount": 1,
    "createdAt": "2026-02-12T05:37:59.427Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "明白了 — **Helix mirror 项目**。",
    "messageCount": 1,
    "createdAt": "2026-02-12T07:53:53.294Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "让我换个方式，你可能需要在系统设置中授权终端访问 Notes。让我先用 Bear Notes 保存，或者你可以手动复制：",
    "messageCount": 5,
    "createdAt": "2026-02-12T10:37:42.597Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "让我帮你处理授权问题。需要在系统设置中给终端权限：",
    "messageCount": 3,
    "createdAt": "2026-02-12T12:34:19.947Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "让我检查 craft agent 的配置和状态：",
    "messageCount": 3,
    "createdAt": "2026-02-12T13:07:26.580Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "## cyber-claw 项目研究",
    "messageCount": 1,
    "createdAt": "2026-02-12T14:10:45.357Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "让我查前天的记忆文件：",
    "messageCount": 2,
    "createdAt": "2026-02-12T14:32:35.528Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "找到了！这就是前天的 **Helix Mirror** 想法。让我提取完整内容：",
    "messageCount": 2,
    "createdAt": "2026-02-12T14:48:29.090Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "明白了！基于 **Helix Mirror** 的需求来研究 XRDP 的适用性。",
    "messageCount": 1,
    "createdAt": "2026-02-12T15:00:49.907Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "Obsidian 非常适合 **Helix Mirror**！让我从几个维度分析：",
    "messageCount": 1,
    "createdAt": "2026-02-12T15:50:38.621Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "**不是官方的**，是社区第三方开发的工具。",
    "messageCount": 1,
    "createdAt": "2026-02-12T16:03:27.162Z"
  },
  {
    "agentId": "main",
    "channel": "飞书",
    "messagePreview": "找到了！**Obsidian 1.12 确实推出了官方 CLI**，是 2 天前发布的（early access for Catalyst members）。",
    "messageCount": 2,
    "createdAt": "2026-02-12T16:21:09.695Z"
  }
];
  
  for (const interaction of interactions) {
    await prisma.interaction.create({ data: interaction });
  }
  console.log(`✅ 导入 ${interactions.length} 条 Interactions`);

  // 导入 Projects
  const projects = [];
  
  for (const project of projects) {
    await prisma.project.create({ data: project });
  }
  console.log(`✅ 导入 ${projects.length} 个 Projects`);

  // 导入 Routing Logs
  const routingLogs = [];
  
  for (const log of routingLogs) {
    await prisma.routingLog.create({ data: log });
  }
  console.log(`✅ 导入 ${routingLogs.length} 条 Routing Logs`);

  console.log('🎉 数据导入完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
