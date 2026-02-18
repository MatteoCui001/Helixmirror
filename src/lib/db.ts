/**
 * 数据库适配层 - Helix Mirror
 * 
 * 强制使用 SQLite 模式（简化版）
 * 云端部署时通过环境变量切换
 * 
 * 改进：
 * - 支持从环境变量配置数据库路径
 * - 更健壮的错误处理
 * - 日志输出
 */

import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';

// ===========================================
// 配置常量
// ===========================================

/**
 * 数据库路径配置
 * 
 * 优先级：
 * 1. 环境变量 DATABASE_PATH
 * 2. 默认路径 ./data/helix.db
 * 
 * 为什么需要可配置：
 * - 不同部署环境路径不同
 * - Docker 容器需要指定卷挂载路径
 * - 测试环境需要隔离数据
 */
const DATA_DIR = process.env.DATABASE_PATH 
  ? dirname(process.env.DATABASE_PATH)
  : join(process.cwd(), 'data');

const SQLITE_PATH = process.env.DATABASE_PATH 
  || join(DATA_DIR, 'helix.db');

// 调试日志（开发环境）
if (process.env.NODE_ENV === 'development') {
  console.log('[DB] 数据库路径:', SQLITE_PATH);
}

// SQLite 实例（单例）
let sqliteDb: Database.Database | null = null;

// ===========================================
// 数据库连接管理
// ===========================================

/**
 * 获取 SQLite 数据库连接
 * 
 * 单例模式：
 * - 避免重复创建连接
 * - better-sqlite3 是同步驱动，不需要连接池
 * 
 * 错误处理：
 * - 目录创建失败会抛出错误
 * - 数据库文件权限问题会抛出错误
 */
function getSQLiteDb(): Database.Database {
  if (!sqliteDb) {
    try {
      // 确保数据目录存在
      mkdirSync(DATA_DIR, { recursive: true });
    } catch (error) {
      console.error('[DB] 创建数据目录失败:', DATA_DIR, error);
      throw new Error(`无法创建数据目录: ${DATA_DIR}`);
    }
    
    try {
      sqliteDb = new Database(SQLITE_PATH);
      // 启用 WAL 模式 - 提升并发写入性能
      sqliteDb.pragma('journal_mode = WAL');
      
      // 初始化表结构
      initSQLiteTables(sqliteDb);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[DB] 数据库连接成功');
      }
    } catch (error) {
      console.error('[DB] 连接数据库失败:', SQLITE_PATH, error);
      throw new Error(`无法连接数据库: ${SQLITE_PATH}`);
    }
  }
  return sqliteDb;
}

// ===========================================
// 表结构初始化
// ===========================================

/**
 * 初始化 SQLite 表
 * 
 * 用途：
 * - 首次运行时创建表结构
 * - 后续运行检查表是否存在（IF NOT EXISTS）
 * 
 * 包含的表：
 * - agents: Agent 元信息
 * - interactions: 交互记录（核心数据）
 * - projects: 项目记忆
 * - routing_logs: 路由决策日志
 */
function initSQLiteTables(db: Database.Database): void {
  // agents 表 - Agent 元信息
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      description TEXT,
      channel TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // interactions 表 - 核心数据表
  db.exec(`
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      message_preview TEXT,
      message_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 索引 - 加速时间范围查询
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_interactions_time 
    ON interactions(agent_id, created_at)
  `);
  
  // projects 表 - 项目记忆层
  db.exec(`
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
  
  // routing_logs 表 - 路由决策记录
  db.exec(`
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
  
  // 插入默认 Agents（如果不存在）
  insertDefaultAgents(db);
}

/**
 * 插入默认 Agent 数据
 * 
 * 用途：
 * - 首次运行初始化 4 个核心 Agent
 * - 后续运行跳过（INSERT OR IGNORE）
 */
function insertDefaultAgents(db: Database.Database): void {
  const insertAgent = db.prepare(`
    INSERT OR IGNORE INTO agents (id, name, role, channel, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const agents = [
    ['main', 'Main', '主助手', '飞书', 'OpenClaw 主渠道，日常对话和任务协调'],
    ['craft', 'Craft', '代码助手', 'Discord', '编程和技术开发相关'],
    ['alpha', 'Alpha', '投资助手', 'Discord', '投资组合和市场分析'],
    ['helix', 'Helix', 'Discord助手', 'Discord', 'Discord 通用助手'],
  ];
  
  for (const agent of agents) {
    insertAgent.run(...agent);
  }
}

// ===========================================
// 统一数据库接口
// ===========================================

/**
 * 数据库接口类型
 * 
 * 设计目的：
 * - 封装 better-sqlite3 的差异
 * - 提供类型安全的 API
 * - 便于后续切换数据库（如 PostgreSQL）
 */
interface UnifiedDatabase {
  query: (sql: string, params?: any[]) => { rows: any[]; rowCount?: number };
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    run: (...params: any[]) => { lastInsertRowid: number | bigint };
    all: (...params: any[]) => any[];
    get: (...params: any[]) => any | undefined;
  };
  close: () => void;
}

/**
 * 获取数据库连接
 * 
 * 返回统一接口，隐藏底层实现细节
 */
export function getDatabase(): UnifiedDatabase {
  const db = getSQLiteDb();
  
  return {
    query: (sql: string, params?: any[]) => {
      const stmt = db.prepare(sql);
      const rows = params ? stmt.all(...params) : stmt.all();
      return { rows, rowCount: rows.length };
    },
    exec: (sql: string) => db.exec(sql),
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
    close: () => {
      db.close();
      sqliteDb = null;
    },
  };
}

/**
 * 初始化数据库
 * 
 * 用途：
 * - 应用启动时调用
 * - 确保表结构和默认数据存在
 */
export function initDatabase(): void {
  getSQLiteDb();
}

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
    if (process.env.NODE_ENV === 'development') {
      console.log('[DB] 数据库连接已关闭');
    }
  }
}

/**
 * 获取数据库状态信息
 * 
 * 用途：
 * - 健康检查
 * - 调试信息
 * - 监控数据库大小
 */
export function getDatabaseInfo(): { path: string; dir: string } {
  return {
    path: SQLITE_PATH,
    dir: DATA_DIR,
  };
}

// 为了兼容旧代码，保留这些空函数
export function getPrisma(): never {
  throw new Error('Prisma 已禁用，请使用 getDatabase()');
}
