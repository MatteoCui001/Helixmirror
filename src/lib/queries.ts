/**
 * 仪表盘数据查询模块
 * 
 * 用途：封装所有仪表盘相关的数据查询逻辑
 * 使用 SQLite（本地开发 + Vercel 部署）
 */

import { getDatabase } from './db';

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
export function getAgentStats(): AgentStat[] {
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
 * 获取今日概览统计
 */
export function getTodayOverview(): TodayOverview {
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
 * 获取最近活动列表
 */
export function getRecentActivities(limit: number = 10): RecentActivity[] {
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
 * 添加一条交互记录
 */
export function addInteraction(
  agentId: string,
  channel: string,
  messagePreview: string,
  messageCount: number = 1
): void {
  const db = getDatabase();
  
  const insert = db.prepare(`
    INSERT INTO interactions (agent_id, channel, message_preview, message_count)
    VALUES (?, ?, ?, ?)
  `);
  
  insert.run(agentId, channel, messagePreview, messageCount);
}
