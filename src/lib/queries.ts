/**
 * 仪表盘数据查询模块
 * 
 * 用途：封装所有仪表盘相关的数据查询逻辑
 * 支持双模式：SQLite（本地开发）和 PostgreSQL（云端部署）
 * 
 * 为什么单独封装：
 * - 分离数据层和展示层，便于测试和维护
 * - 双模式支持：通过 USE_POSTGRES 环境变量自动切换
 * - 可以复用这些查询在其他地方（如 API 路由）
 */

import { getDatabase, getPrisma } from './db';
import { PrismaClient } from '@prisma/client';

// 判断是否使用 PostgreSQL
const USE_POSTGRES = process.env.USE_POSTGRES === 'true';

/**
 * Agent 统计信息
 */
export interface AgentStat {
  id: string;
  name: string;
  role: string;
  totalInteractions: number;
  todayInteractions: number;
  lastActive: string | null;
}

/**
 * 今日概览统计
 */
export interface TodayOverview {
  totalMessages: number;
  activeAgents: number;
  totalInteractions: number;
}

/**
 * 最近活动记录
 */
export interface RecentActivity {
  id: number;
  agentName: string;
  agentRole: string;
  channel: string;
  messagePreview: string;
  createdAt: string;
}

/**
 * 获取所有 Agent 的统计数据
 */
export async function getAgentStats(): Promise<AgentStat[]> {
  if (USE_POSTGRES) {
    return getAgentStatsPostgres();
  }
  return getAgentStatsSQLite();
}

/**
 * SQLite 模式：获取 Agent 统计
 */
function getAgentStatsSQLite(): AgentStat[] {
  const db = getDatabase();
  
  const query = db.prepare(`
    SELECT 
      a.id,
      a.name,
      a.role,
      COALESCE(today.count, 0) as todayInteractions,
      COALESCE(total.count, 0) as totalInteractions,
      last_time.max_time as lastActive
    FROM agents a
    LEFT JOIN (
      SELECT agent_id, COUNT(*) as count 
      FROM interactions 
      WHERE date(created_at) = date('now')
      GROUP BY agent_id
    ) today ON a.id = today.agent_id
    LEFT JOIN (
      SELECT agent_id, COUNT(*) as count 
      FROM interactions 
      GROUP BY agent_id
    ) total ON a.id = total.agent_id
    LEFT JOIN (
      SELECT agent_id, MAX(created_at) as max_time 
      FROM interactions 
      GROUP BY agent_id
    ) last_time ON a.id = last_time.agent_id
    ORDER BY todayInteractions DESC, totalInteractions DESC
  `);
  
  return query.all() as AgentStat[];
}

/**
 * PostgreSQL 模式：获取 Agent 统计
 */
async function getAgentStatsPostgres(): Promise<AgentStat[]> {
  const prisma = getPrisma();
  
  // 获取所有 agents
  const agents = await prisma.agent.findMany();
  
  // 获取今日开始时间
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 为每个 agent 查询统计
  const stats: AgentStat[] = [];
  
  for (const agent of agents) {
    const [todayCount, totalCount, lastInteraction] = await Promise.all([
      prisma.interaction.count({
        where: {
          agentId: agent.agentId,
          createdAt: { gte: today }
        }
      }),
      prisma.interaction.count({
        where: { agentId: agent.agentId }
      }),
      prisma.interaction.findFirst({
        where: { agentId: agent.agentId },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    
    stats.push({
      id: agent.agentId,
      name: agent.name,
      role: agent.role,
      totalInteractions: totalCount,
      todayInteractions: todayCount,
      lastActive: lastInteraction?.createdAt.toISOString() || null
    });
  }
  
  // 按今日交互数排序
  stats.sort((a, b) => b.todayInteractions - a.todayInteractions || b.totalInteractions - a.totalInteractions);
  
  return stats;
}

/**
 * 获取今日概览统计
 */
export async function getTodayOverview(): Promise<TodayOverview> {
  if (USE_POSTGRES) {
    return getTodayOverviewPostgres();
  }
  return getTodayOverviewSQLite();
}

/**
 * SQLite 模式：获取今日概览
 */
function getTodayOverviewSQLite(): TodayOverview {
  const db = getDatabase();
  
  const query = db.prepare(`
    SELECT 
      COALESCE(SUM(message_count), 0) as totalMessages,
      COUNT(DISTINCT agent_id) as activeAgents,
      COUNT(*) as totalInteractions
    FROM interactions
    WHERE date(created_at) = date('now')
  `);
  
  return query.get() as TodayOverview;
}

/**
 * PostgreSQL 模式：获取今日概览
 */
async function getTodayOverviewPostgres(): Promise<TodayOverview> {
  const prisma = getPrisma();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [messages, activeAgents, interactions] = await Promise.all([
    prisma.interaction.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { messageCount: true }
    }),
    prisma.interaction.groupBy({
      by: ['agentId'],
      where: { createdAt: { gte: today } }
    }),
    prisma.interaction.count({
      where: { createdAt: { gte: today } }
    })
  ]);
  
  return {
    totalMessages: messages._sum.messageCount || 0,
    activeAgents: activeAgents.length,
    totalInteractions: interactions
  };
}

/**
 * 获取最近活动列表
 */
export async function getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
  if (USE_POSTGRES) {
    return getRecentActivitiesPostgres(limit);
  }
  return getRecentActivitiesSQLite(limit);
}

/**
 * SQLite 模式：获取最近活动
 */
function getRecentActivitiesSQLite(limit: number): RecentActivity[] {
  const db = getDatabase();
  
  const query = db.prepare(`
    SELECT 
      i.id,
      a.name as agentName,
      a.role as agentRole,
      i.channel,
      i.message_preview as messagePreview,
      i.created_at as createdAt
    FROM interactions i
    JOIN agents a ON i.agent_id = a.id
    ORDER BY i.created_at DESC
    LIMIT ?
  `);
  
  return query.all(limit) as RecentActivity[];
}

/**
 * PostgreSQL 模式：获取最近活动
 */
async function getRecentActivitiesPostgres(limit: number): Promise<RecentActivity[]> {
  const prisma = getPrisma();
  
  const interactions = await prisma.interaction.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { agent: true }
  });
  
  return interactions.map(i => ({
    id: i.id,
    agentName: i.agent.name,
    agentRole: i.agent.role,
    channel: i.channel,
    messagePreview: i.messagePreview,
    createdAt: i.createdAt.toISOString()
  }));
}

/**
 * 添加一条交互记录
 */
export async function addInteraction(
  agentId: string,
  channel: string,
  messagePreview: string,
  messageCount: number = 1
): Promise<void> {
  if (USE_POSTGRES) {
    await addInteractionPostgres(agentId, channel, messagePreview, messageCount);
  } else {
    addInteractionSQLite(agentId, channel, messagePreview, messageCount);
  }
}

/**
 * SQLite 模式：添加交互记录
 */
function addInteractionSQLite(
  agentId: string,
  channel: string,
  messagePreview: string,
  messageCount: number
): void {
  const db = getDatabase();
  
  const insert = db.prepare(`
    INSERT INTO interactions (agent_id, channel, message_preview, message_count)
    VALUES (?, ?, ?, ?)
  `);
  
  insert.run(agentId, channel, messagePreview, messageCount);
}

/**
 * PostgreSQL 模式：添加交互记录
 */
async function addInteractionPostgres(
  agentId: string,
  channel: string,
  messagePreview: string,
  messageCount: number
): Promise<void> {
  const prisma = getPrisma();
  
  await prisma.interaction.create({
    data: {
      agentId,
      channel,
      messagePreview,
      messageCount
    }
  });
}
