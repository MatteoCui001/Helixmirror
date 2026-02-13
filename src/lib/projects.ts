/**
 * 项目数据查询模块
 * 
 * 用途：封装 projects 表的所有数据操作
 * 支持双模式：SQLite（本地）和 PostgreSQL（云端）
 * 
 * projects 表的作用：
 * - 存储跨 Agent 共享的项目上下文
 * - 记录项目状态和关联的 Agent
 */

import { getDatabase, getPrisma } from './db';

const USE_POSTGRES = process.env.USE_POSTGRES === 'true';

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

/**
 * 获取所有项目
 */
export async function getAllProjects(): Promise<Project[]> {
  if (USE_POSTGRES) {
    return getAllProjectsPostgres();
  }
  return getAllProjectsSQLite();
}

/**
 * SQLite 模式：获取所有项目
 */
function getAllProjectsSQLite(): Project[] {
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
  
  const rows = query.all() as any[];
  
  return rows.map(row => ({
    ...row,
    agentIds: row.agentIds ? JSON.parse(row.agentIds) : []
  }));
}

/**
 * PostgreSQL 模式：获取所有项目
 */
async function getAllProjectsPostgres(): Promise<Project[]> {
  const prisma = getPrisma();
  
  const projects = await prisma.project.findMany({
    orderBy: [
      { status: 'asc' },
      { updatedAt: 'desc' }
    ]
  });
  
  return projects.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status as 'active' | 'paused' | 'completed',
    agentIds: p.agentIds ? JSON.parse(p.agentIds) : [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  }));
}

/**
 * 根据 ID 获取单个项目
 */
export async function getProjectById(id: number): Promise<Project | null> {
  if (USE_POSTGRES) {
    return getProjectByIdPostgres(id);
  }
  return getProjectByIdSQLite(id);
}

/**
 * SQLite 模式：获取单个项目
 */
function getProjectByIdSQLite(id: number): Project | null {
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
  
  const row = query.get(id) as any;
  
  if (!row) return null;
  
  return {
    ...row,
    agentIds: row.agentIds ? JSON.parse(row.agentIds) : []
  };
}

/**
 * PostgreSQL 模式：获取单个项目
 */
async function getProjectByIdPostgres(id: number): Promise<Project | null> {
  const prisma = getPrisma();
  
  const project = await prisma.project.findUnique({
    where: { id }
  });
  
  if (!project) return null;
  
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status as 'active' | 'paused' | 'completed',
    agentIds: project.agentIds ? JSON.parse(project.agentIds) : [],
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}

/**
 * 创建新项目
 */
export async function createProject(
  name: string,
  description?: string,
  agentIds?: string[]
): Promise<number> {
  if (USE_POSTGRES) {
    return createProjectPostgres(name, description, agentIds);
  }
  return createProjectSQLite(name, description, agentIds);
}

/**
 * SQLite 模式：创建项目
 */
function createProjectSQLite(
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
 * PostgreSQL 模式：创建项目
 */
async function createProjectPostgres(
  name: string,
  description?: string,
  agentIds?: string[]
): Promise<number> {
  const prisma = getPrisma();
  
  const project = await prisma.project.create({
    data: {
      name,
      description,
      agentIds: agentIds ? JSON.stringify(agentIds) : "[]"
    }
  });
  
  return project.id;
}

/**
 * 更新项目状态
 */
export async function updateProjectStatus(
  id: number,
  status: 'active' | 'paused' | 'completed'
): Promise<void> {
  if (USE_POSTGRES) {
    await updateProjectStatusPostgres(id, status);
  } else {
    updateProjectStatusSQLite(id, status);
  }
}

/**
 * SQLite 模式：更新项目状态
 */
function updateProjectStatusSQLite(
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
 * PostgreSQL 模式：更新项目状态
 */
async function updateProjectStatusPostgres(
  id: number,
  status: 'active' | 'paused' | 'completed'
): Promise<void> {
  const prisma = getPrisma();
  
  await prisma.project.update({
    where: { id },
    data: { status }
  });
}

/**
 * 获取项目统计信息
 */
export async function getProjectStats(): Promise<{
  total: number;
  active: number;
  paused: number;
  completed: number;
}> {
  if (USE_POSTGRES) {
    return getProjectStatsPostgres();
  }
  return getProjectStatsSQLite();
}

/**
 * SQLite 模式：获取项目统计
 */
function getProjectStatsSQLite(): {
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
  
  return query.get() as any;
}

/**
 * PostgreSQL 模式：获取项目统计
 */
async function getProjectStatsPostgres(): Promise<{
  total: number;
  active: number;
  paused: number;
  completed: number;
}> {
  const prisma = getPrisma();
  
  const [total, active, paused, completed] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: 'active' } }),
    prisma.project.count({ where: { status: 'paused' } }),
    prisma.project.count({ where: { status: 'completed' } })
  ]);
  
  return { total, active, paused, completed };
}
