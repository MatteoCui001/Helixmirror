-- Helix Mirror 数据迁移 SQL
-- 生成时间: 2026-02-13T02:56:36.806Z
-- 来源: SQLite (local)
-- 目标: PostgreSQL (Supabase)

-- 禁用外键检查（如有需要）
-- SET session_replication_role = replica;

BEGIN;

-- === Agents ===
INSERT INTO agents (agent_id, name, role, description, channel, created_at) VALUES (
      'main',
      'Main',
      '主助手',
      'OpenClaw 主渠道，日常对话和任务协调',
      '飞书',
      '2026-02-11 07:05:02'
    ) ON CONFLICT (agent_id) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      description = EXCLUDED.description,
      channel = EXCLUDED.channel;
INSERT INTO agents (agent_id, name, role, description, channel, created_at) VALUES (
      'craft',
      'Craft',
      '代码助手',
      '编程和技术开发相关',
      'Discord',
      '2026-02-11 07:05:02'
    ) ON CONFLICT (agent_id) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      description = EXCLUDED.description,
      channel = EXCLUDED.channel;
INSERT INTO agents (agent_id, name, role, description, channel, created_at) VALUES (
      'alpha',
      'Alpha',
      '投资助手',
      '投资组合和市场分析',
      'Discord',
      '2026-02-11 07:05:02'
    ) ON CONFLICT (agent_id) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      description = EXCLUDED.description,
      channel = EXCLUDED.channel;
INSERT INTO agents (agent_id, name, role, description, channel, created_at) VALUES (
      'helix',
      'Helix',
      'Discord助手',
      'Discord 通用助手',
      'Discord',
      '2026-02-11 07:05:02'
    ) ON CONFLICT (agent_id) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      description = EXCLUDED.description,
      channel = EXCLUDED.channel;

-- === Interactions ===
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '🎉 **飞书通了！** 我看到你从飞书发过来的图片了，网络问题解决了。',
      3,
      '2026-02-03T17:13:24.098Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '收到！👍',
      1,
      '2026-02-03T17:35:50.631Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '能收到！✅',
      2,
      '2026-02-03T18:49:44.412Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '嗯，我看完这份文档了。很有意思的Agent架构演化思路——从v0的"极简主义"到v3的"专业化分工"，但核心理念一直没变：**循环 + 工具调用 = Agent**。',
      1,
      '2026-02-04T01:09:50.688Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '我收到了你的语音消息！但我**暂时无法转录**，因为我还没有配置 ASR（语音转文字）工具。',
      2,
      '2026-02-04T09:56:07.137Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'alpha',
      'Discord',
      '持仓分析和市场观察',
      6,
      '2026-02-10 07:05:02'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '日常任务处理和日程安排',
      4,
      '2026-02-10 07:05:02'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '在线呢 👋',
      1,
      '2026-02-10T06:03:17.721Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '我是 Helix 🧬，一个 AI 助手。',
      4,
      '2026-02-10T17:19:48.319Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      'Memory 日志里记录了这几天的关键事件：',
      4,
      '2026-02-10T17:37:57.998Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '让我检查一下状态：',
      4,
      '2026-02-10T17:50:02.233Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '诚实回答：',
      1,
      '2026-02-10T17:57:06.880Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '是的，这个设计挺合理的 👍',
      3,
      '2026-02-10T18:04:15.767Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '你是在说消息有延迟吗？还是发了我没回复？',
      5,
      '2026-02-10T18:10:00.308Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'craft',
      'Discord',
      '讨论 Helix Mirror 架构设计',
      5,
      '2026-02-11 03:05:02'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '复盘系统搭建和需求确认',
      8,
      '2026-02-11 04:05:02'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'craft',
      'Discord',
      '初始化 Helix Mirror 项目',
      12,
      '2026-02-11 05:05:02'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '配置自动审批和权限设置',
      3,
      '2026-02-11 06:35:02'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'craft',
      'Discord',
      '完成 Helix Mirror Phase 1.5 开发',
      8,
      '2026-02-11 12:48:52'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '配置飞书 Bridge 自动同步',
      5,
      '2026-02-11 12:48:52'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'alpha',
      'Discord',
      '分析特斯拉财报数据',
      3,
      '2026-02-11 12:48:52'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'craft',
      'Discord',
      '修复 ActivityList 语法错误',
      2,
      '2026-02-11 12:48:52'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '设置定时健康检查',
      4,
      '2026-02-11 12:48:52'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '这是一个很有意思的长期任务。让我先了解一下现状，然后帮你设置好。',
      6,
      '2026-02-11T04:28:04.591Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '我先看看 shared memo 的现状，然后把这个 idea 写进去。',
      3,
      '2026-02-11T04:39:45.011Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '好的，我来把 Helix Mirror 的创意发给 Craft。我先看看他的 session 状态。',
      5,
      '2026-02-11T05:09:27.879Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      'Craft 也需要唤醒——你直接在 Discord 上发一条消息给 @code_buddy，他就会回复你。',
      1,
      '2026-02-11T05:16:53.365Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '我来帮你设置。你写的是 `sutoApprove`，应该是 `autoApprove` 的笔误吧？',
      2,
      '2026-02-11T05:27:20.292Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '✅ **已完成**',
      1,
      '2026-02-11T05:34:42.570Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '让我验证一下配置是否真的生效了：',
      2,
      '2026-02-11T06:00:39.587Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '✅ **已完成**',
      1,
      '2026-02-11T06:37:39.064Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '读完了，这篇分析很到位。',
      1,
      '2026-02-11T06:53:37.226Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '我检查一下 Discord 的连接状态。',
      3,
      '2026-02-11T07:12:27.508Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '抱歉，刚才是图片内容，我现在发给你：',
      2,
      '2026-02-11T08:38:37.568Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '找到了！Claude Code 确实已下载在 `~/.claude/downloads/claude-2.1.29-darwin-arm64`，但没有添加到系统 PATH。',
      2,
      '2026-02-11T09:17:44.806Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '我检查一下 Discord 和 Craft 的状态。',
      2,
      '2026-02-11T14:59:26.444Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '已发送。',
      1,
      '2026-02-11T17:52:05.378Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '✅ 已保存到 `shared-memo/2026-02-11-daily-review.md`',
      3,
      '2026-02-11T18:06:47.634Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      'HEARTBEAT.md 是空的，目前没配置自动检查任务。让我读取健康检查技能，帮你做一次系统健康检查。',
      4,
      '2026-02-12T01:15:21.462Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '---',
      1,
      '2026-02-12T01:21:25.236Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '## 反向代理简单解释',
      3,
      '2026-02-12T01:54:01.383Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '没有，我还在。npm 更新被中断了（超时被杀掉）。让我检查当前状态：',
      2,
      '2026-02-12T03:37:03.513Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '看不到，每个 agent 的会话是独立的。让我检查一下：',
      2,
      '2026-02-12T05:03:51.713Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '我看到消息被截断了，但大概明白你们在讨论 **Claude Code 的使用方式**。',
      1,
      '2026-02-12T05:37:59.427Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '明白了 — **Helix mirror 项目**。',
      1,
      '2026-02-12T07:53:53.294Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '让我换个方式，你可能需要在系统设置中授权终端访问 Notes。让我先用 Bear Notes 保存，或者你可以手动复制：',
      5,
      '2026-02-12T10:37:42.597Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '让我帮你处理授权问题。需要在系统设置中给终端权限：',
      3,
      '2026-02-12T12:34:19.947Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '让我检查 craft agent 的配置和状态：',
      3,
      '2026-02-12T13:07:26.580Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '## cyber-claw 项目研究',
      1,
      '2026-02-12T14:10:45.357Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '让我查前天的记忆文件：',
      2,
      '2026-02-12T14:32:35.528Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '找到了！这就是前天的 **Helix Mirror** 想法。让我提取完整内容：',
      2,
      '2026-02-12T14:48:29.090Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '明白了！基于 **Helix Mirror** 的需求来研究 XRDP 的适用性。',
      1,
      '2026-02-12T15:00:49.907Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      'Obsidian 非常适合 **Helix Mirror**！让我从几个维度分析：',
      1,
      '2026-02-12T15:50:38.621Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '**不是官方的**，是社区第三方开发的工具。',
      1,
      '2026-02-12T16:03:27.162Z'
    );
INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      'main',
      '飞书',
      '找到了！**Obsidian 1.12 确实推出了官方 CLI**，是 2 天前发布的（early access for Catalyst members）。',
      2,
      '2026-02-12T16:21:09.695Z'
    );

-- === Projects ===


-- === Routing Logs ===



-- 重新启用外键检查
-- SET session_replication_role = DEFAULT;

COMMIT;

-- 验证数据
SELECT 'agents' as table_name, COUNT(*) as count FROM agents
UNION ALL
SELECT 'interactions' as table_name, COUNT(*) as count FROM interactions
UNION ALL
SELECT 'projects' as table_name, COUNT(*) as count FROM projects
UNION ALL
SELECT 'routing_logs' as table_name, COUNT(*) as count FROM routing_logs;
