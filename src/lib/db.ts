/**
 * 数据库适配层 - Helix Mirror
 * 
 * 强制使用 SQLite 模式（简化版）
 * 云端部署时通过环境变量切换
 */

import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

// 本地 SQLite 配置
const DATA_DIR = join(process.cwd(), 'data');
const SQLITE_PATH = join(DATA_DIR, 'helix.db');

// SQLite 实例（单例）
let sqliteDb: Database.Database | null = null;

/**
 * 获取 SQLite 数据库连接
 */
function getSQLiteDb(): Database.Database {
  if (!sqliteDb) {
    try {
      mkdirSync(DATA_DIR, { recursive: true });
    } catch {}
    
    sqliteDb = new Database(SQLITE_PATH);
    sqliteDb.pragma('journal_mode = WAL');
    
    // 初始化表结构
    initSQLiteTables(sqliteDb);
  }
  return sqliteDb;
}

/**
 * 初始化 SQLite 表
 */
function initSQLiteTables(db: Database.Database): void {
  // agents 表
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
  
  // interactions 表
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
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_interactions_time ON interactions(agent_id, created_at)`);
  
  // projects 表
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
  
  // routing_logs 表
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
  
  // 插入默认 Agents
  const insertAgent = db.prepare(`
    INSERT OR IGNORE INTO agents (id, name, role, channel, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertAgent.run('main', 'Main', '主助手', '飞书', 'OpenClaw 主渠道，日常对话和任务协调');
  insertAgent.run('craft', 'Craft', '代码助手', 'Discord', '编程和技术开发相关');
  insertAgent.run('alpha', 'Alpha', '投资助手', 'Discord', '投资组合和市场分析');
  insertAgent.run('helix', 'Helix', 'Discord助手', 'Discord', 'Discord 通用助手');
}

/**
 * 统一数据库接口
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
 */
export function initDatabase(): void {
  getSQLiteDb();
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
}

// 为了兼容旧代码，保留这些空函数
export function getPrisma(): never {
  throw new Error('Prisma 已禁用，请使用 getDatabase()');
}
