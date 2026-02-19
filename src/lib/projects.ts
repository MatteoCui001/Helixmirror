/**
 * 项目数据查询模块
 * 
 * 用途：封装 projects 表的所有数据操作
 * 使用 SQLite（本地开发 + Vercel 部署）
 */

import { getDatabase } from './db';

/**
 * 项目数据结构
 */
export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: 'active' | 'paused' | 'completed';
  agentIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectRow {
  id: number;
  name: string;
  description: string | null;
  status: 'active' | 'paused' | 'completed';
  agentIds: string | null;
  createdAt: string;
  updatedAt: string;
}

function parseAgentIds(agentIds: string | null): string[] {
  if (!agentIds) {
    return [];
  }

  try {
    const parsed = JSON.parse(agentIds);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * 获取所有项目
 */
export function getAllProjects(): Project[] {
  const db = getDatabase();
  
  const query = db.prepare(`
    SELECT 
      id,
      name,
      description,
      status,
      agent_ids as agentIds,
      created_at as createdAt,
      updated_at as updatedAt
    FROM projects
    ORDER BY 
      CASE status 
        WHEN 'active' THEN 1 
        WHEN 'paused' THEN 2 
        ELSE 3 
      END,
      updated_at DESC
  `);
  
  const rows = query.all() as ProjectRow[];
  
  return rows.map((row) => ({
    ...row,
    agentIds: parseAgentIds(row.agentIds),
  }));
}

/**
 * 根据 ID 获取单个项目
 */
export function getProjectById(id: number): Project | null {
  const db = getDatabase();
  
  const query = db.prepare(`
    SELECT 
      id,
      name,
      description,
      status,
      agent_ids as agentIds,
      created_at as createdAt,
      updated_at as updatedAt
    FROM projects
    WHERE id = ?
  `);
  
  const row = query.get(id) as ProjectRow | undefined;
  
  if (!row) return null;
  
  return {
    ...row,
    agentIds: parseAgentIds(row.agentIds),
  };
}

/**
 * 创建新项目
 */
export function createProject(
  name: string,
  description?: string,
  agentIds?: string[]
): number {
  const db = getDatabase();
  
  const insert = db.prepare(`
    INSERT INTO projects (name, description, agent_ids)
    VALUES (?, ?, ?)
  `);
  
  const result = insert.run(
    name,
    description || null,
    agentIds ? JSON.stringify(agentIds) : null
  );
  
  return result.lastInsertRowid as number;
}

/**
 * 更新项目状态
 */
export function updateProjectStatus(
  id: number,
  status: 'active' | 'paused' | 'completed'
): void {
  const db = getDatabase();
  
  const update = db.prepare(`
    UPDATE projects
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  update.run(status, id);
}

/**
 * 获取项目统计信息
 */
export function getProjectStats(): {
  total: number;
  active: number;
  paused: number;
  completed: number;
} {
  const db = getDatabase();
  
  const query = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM projects
  `);

  const row = query.get() as
    | { total: number; active: number | null; paused: number | null; completed: number | null }
    | undefined;

  return {
    total: row?.total ?? 0,
    active: row?.active ?? 0,
    paused: row?.paused ?? 0,
    completed: row?.completed ?? 0,
  };
}
