/**
 * 数据库适配层 - Helix Mirror
 * 
 * 用途：
 * - 统一的数据库访问接口（本地 SQLite 模式）
 * - 云端 PostgreSQL 模式使用 Prisma Client 专用 API
 * - 通过 USE_POSTGRES 环境变量自动切换
 * 
 * 为什么需要双模式：
 * - 本地开发：SQLite 轻量，无需网络，启动快
 * - 云端部署：PostgreSQL（Supabase）支持并发，适合生产环境
 * 
 * 使用方式：
 *   // SQLite 模式（本地开发）
 *   import { getDatabase, initDatabase } from '@/lib/db';
 *   const db = getDatabase();
 *   const result = db.query('SELECT * FROM agents');
 *   
 *   // PostgreSQL 模式（云端部署）- 推荐使用 Prisma Client
 *   import { getPrisma } from '@/lib/db';
 *   const prisma = getPrisma();
 *   const agents = await prisma.agent.findMany();
 */

import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

// ===========================================
// 配置常量
// ===========================================

// 判断是否使用 PostgreSQL（云端模式）
const USE_POSTGRES = process.env.USE_POSTGRES === 'true';

// 本地 SQLite 配置
const DATA_DIR = join(process.cwd(), 'data');
const SQLITE_PATH = process.env.SQLITE_PATH || join(DATA_DIR, 'helix.db');

// ===========================================
// 数据库实例（单例模式）
// ===========================================

// Prisma Client 实例（PostgreSQL 模式）
let prismaClient: PrismaClient | null = null;

// SQLite 实例（本地模式）
let sqliteDb: Database.Database | null = null;

// ===========================================
// SQLite 统一数据库接口
// ===========================================

/**
 * 通用数据库查询接口
 */
interface QueryResult {
  rows: any[];
  rowCount?: number;
}

/**
 * 统一数据库接口（仅用于 SQLite 模式）
 * PostgreSQL 模式请直接使用 getPrisma() 获取 PrismaClient
 */
interface UnifiedDatabase {
  query: (sql: string, params?: any[]) => QueryResult;
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    run: (...params: any[]) => { lastInsertRowid: number | bigint };
    all: (...params: any[]) => any[];
    get: (...params: any[]) => any | undefined;
  };
  close: () => void;
}

// ===========================================
// SQLite 模式实现
// ===========================================

/**
 * 获取 SQLite 数据库连接
 * 
 * 为什么用单例：
 * - SQLite 是文件型数据库，多个连接会导致并发问题
 * - better-sqlite3 的连接是持久的，不需要频繁开关
 */
function getSQLiteDb(): Database.Database {
  if (!sqliteDb) {
    // 确保数据目录存在
    try {
      mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // 目录已存在时忽略错误
    }
    
    sqliteDb = new Database(SQLITE_PATH);
    // 启用 WAL 模式 - 提升并发写入性能
    sqliteDb.pragma('journal_mode = WAL');
  }
  return sqliteDb;
}

/**
 * 创建 SQLite 统一接口
 * 包装 better-sqlite3 以匹配统一接口
 */
function createSQLiteUnifiedDb(): UnifiedDatabase {
  const db = getSQLiteDb();
  
  return {
    // 执行查询并返回结果数组
    query: (sql: string, params?: any[]): QueryResult => {
      const stmt = db.prepare(sql);
      const rows = params ? stmt.all(...params) : stmt.all();
      return { rows, rowCount: rows.length };
    },
    
    // 执行 SQL 语句（无返回）
    exec: (sql: string): void => {
      db.exec(sql);
    },
    
    // 预编译语句
    prepare: (sql: string) => {
      const stmt = db.prepare(sql);
      return {
        run: (...params: any[]) => {
          const result = stmt.run(...params);
          return { lastInsertRowid: result.lastInsertRowid };
        },
        all: (...params: any[]) => stmt.all(...params),
        get: (...params: any[]) => stmt.get(...params),
      };
    },
    
    // 关闭连接
    close: () => {
      db.close();
      sqliteDb = null;
    },
  };
}

// ===========================================
// Prisma/PostgreSQL 模式实现
// ===========================================

/**
 * 获取 Prisma Client 实例
 * 
 * 注意：
 * - Prisma 自动管理连接池，不需要手动开关
 * - 生产环境建议使用连接池中间件（如 PgBouncer）
 * - 这是 PostgreSQL 模式下推荐使用的 API
 */
function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
  }
  return prismaClient;
}

// ===========================================
// 统一导出
// ===========================================

/**
 * 获取数据库连接（仅 SQLite 模式）
 * 
 * 注意：PostgreSQL 模式下请使用 getPrisma()
 */
export function getDatabase(): UnifiedDatabase {
  if (USE_POSTGRES) {
    throw new Error(
      'PostgreSQL 模式下请使用 getPrisma() 获取 PrismaClient，' +
      '或使用 Prisma Client 的类型安全 API 操作数据库。' +
      'getDatabase() 仅支持 SQLite 模式。'
    );
  }
  return createSQLiteUnifiedDb();
}

/**
 * 获取 Prisma Client（PostgreSQL 模式专用）
 * 
 * 用途：
 * - 在 PostgreSQL 模式下使用类型安全的 ORM API
 * - 推荐所有新的数据库操作都使用此 API
 * 
 * 示例：
 *   const prisma = getPrisma();
 *   const agents = await prisma.agent.findMany();
 *   const interactions = await prisma.interaction.findMany({
 *     where: { agentId: 'main' },
 *     orderBy: { createdAt: 'desc' },
 *     take: 10
 *   });
 */
export function getPrisma(): PrismaClient {
  if (!USE_POSTGRES) {
    throw new Error('Prisma 仅在 USE_POSTGRES=true 时可用');
  }
  return getPrismaClient();
}

// ===========================================
// 数据库初始化
// ===========================================

/**
 * 初始化数据库表结构
 * 
 * 注意：
 * - SQLite 模式：创建表并插入默认数据
 * - PostgreSQL 模式：使用 Prisma Migrate 管理 schema
 *   不要调用此函数，而是运行：npx prisma migrate dev
 */
export function initDatabase(): void {
  if (USE_POSTGRES) {
    console.log('PostgreSQL 模式：请使用 Prisma Migrate 初始化数据库');
    console.log('运行：npx prisma migrate dev');
    return;
  }
  
  const database = getSQLiteDb();
  
  // 创建 agents 表 - 存储 Agent 元信息
  database.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      description TEXT,
      channel TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 创建 interactions 表 - 核心数据表
  database.exec(`
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      message_preview TEXT,
      message_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);
  
  // 创建索引 - 加速时间范围查询
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_interactions_time 
    ON interactions(agent_id, created_at)
  `);
  
  // 创建 projects 表 - 项目记忆层
  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      agent_ids TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 创建 routing_logs 表 - 路由推荐记录
  database.exec(`
    CREATE TABLE IF NOT EXISTS routing_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      input_text TEXT NOT NULL,
      recommended_agent_id TEXT NOT NULL,
      recommended_score INTEGER,
      user_selected_agent_id TEXT,
      was_accepted BOOLEAN,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 创建路由日志索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_routing_logs_time 
    ON routing_logs(created_at)
  `);
  
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_routing_logs_agent 
    ON routing_logs(recommended_agent_id)
  `);
  
  // 插入默认 Agent 数据（如果不存在）
  const insertAgent = database.prepare(`
    INSERT OR IGNORE INTO agents (id, name, role, channel, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertAgent.run('main', 'Main', '主助手', '飞书', 'OpenClaw 主渠道，日常对话和任务协调');
  insertAgent.run('craft', 'Craft', '代码助手', 'Discord', '编程和技术开发相关');
  insertAgent.run('alpha', 'Alpha', '投资助手', 'Discord', '投资组合和市场分析');
  insertAgent.run('helix', 'Helix', 'Discord助手', 'Discord', 'Discord 通用助手');
}

// ===========================================
// 连接管理
// ===========================================

/**
 * 关闭数据库连接
 * 
 * 用途：
 * - 应用关闭时清理资源
 * - 测试环境重置连接
 * - 部署前确保数据写入磁盘
 */
export function closeDatabase(): void {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  if (prismaClient) {
    prismaClient.$disconnect();
    prismaClient = null;
  }
}
