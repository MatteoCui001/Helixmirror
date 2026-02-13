/**
 * 数据库初始化脚本
 * 
 * 用途：命令行运行，初始化数据库表结构和默认数据
 * 
 * 使用方法：
 *   npm run db:init
 * 
 * 为什么用纯 JS：
 * - 避免 TypeScript 编译步骤
 * - 可以直接用 node 运行
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 数据目录路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'helix.db');

console.log('🔄 正在初始化 Helix Mirror 数据库...\n');

try {
  // 确保数据目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 连接数据库
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // 创建 agents 表
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

  // 创建 interactions 表
  db.exec(`
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

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_interactions_time 
    ON interactions(agent_id, created_at)
  `);

  // 创建 projects 表
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

  // 插入默认 Agent 数据
  const insertAgent = db.prepare(`
    INSERT OR IGNORE INTO agents (id, name, role, channel, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertAgent.run('main', 'Main', '主助手', '飞书', 'OpenClaw 主渠道，日常对话和任务协调');
  insertAgent.run('craft', 'Craft', '代码助手', 'Discord', '编程和技术开发相关');
  insertAgent.run('alpha', 'Alpha', '投资助手', 'Discord', '投资组合和市场分析');
  insertAgent.run('helix', 'Helix', 'Discord助手', 'Discord', 'Discord 通用助手');

  // 插入一些示例数据让仪表盘有内容显示
  const insertInteraction = db.prepare(`
    INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at)
    VALUES (?, ?, ?, ?, datetime('now', ?))
  `);

  // 今日数据
  insertInteraction.run('craft', 'Discord', '讨论 Helix Mirror 架构设计', 5, '-4 hours');
  insertInteraction.run('main', '飞书', '复盘系统搭建和需求确认', 8, '-3 hours');
  insertInteraction.run('craft', 'Discord', '初始化 Helix Mirror 项目', 12, '-2 hours');
  insertInteraction.run('main', '飞书', '配置自动审批和权限设置', 3, '-30 minutes');

  // 昨日数据
  insertInteraction.run('alpha', 'Discord', '持仓分析和市场观察', 6, '-1 days');
  insertInteraction.run('main', '飞书', '日常任务处理和日程安排', 4, '-1 days');

  // 验证结果
  const agents = db.prepare('SELECT * FROM agents').all();
  const todayCount = db.prepare(`
    SELECT COUNT(*) as count FROM interactions 
    WHERE date(created_at) = date('now')
  `).get();

  console.log('✅ 数据库初始化成功！\n');
  console.log('已创建的 Agent：');
  agents.forEach((agent) => {
    console.log(`  • ${agent.name} (${agent.role}) - ${agent.channel}`);
  });
  console.log(`\n今日交互记录：${todayCount.count} 条`);
  console.log('\n数据库文件位置：', DB_PATH);
  console.log('\n现在可以运行：npm run dev');
  console.log('然后访问 http://localhost:3000');

  db.close();
  
} catch (error) {
  console.error('❌ 初始化失败：', error.message);
  process.exit(1);
}
