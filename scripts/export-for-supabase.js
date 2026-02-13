/**
 * 数据迁移脚本 - SQLite → Supabase PostgreSQL
 * 
 * 用途：
 * - 将本地 SQLite 数据库的数据导出
 * - 准备导入到 Supabase PostgreSQL
 * - 生成 SQL INSERT 语句或 JSON 格式
 * 
 * 使用方法：
 *   node scripts/export-for-supabase.js
 * 
 * 输出：
 * - data/export/agents.json - Agent 数据
 * - data/export/interactions.json - 交互记录
 * - data/export/projects.json - 项目数据
 * - data/export/migration.sql - 可直接执行的 SQL
 * 
 * 导入到 Supabase：
 * 1. 在 Supabase Dashboard 打开 SQL Editor
 * 2. 粘贴 migration.sql 内容并执行
 * 3. 或使用 Supabase CLI: supabase db execute --file migration.sql
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 配置
const DB_PATH = path.join(__dirname, '..', 'data', 'helix.db');
const EXPORT_DIR = path.join(__dirname, '..', 'data', 'export');

/**
 * 确保导出目录存在
 */
function ensureExportDir() {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
}

/**
 * 转义 SQL 字符串值
 * 防止 SQL 注入和特殊字符问题
 */
function escapeSql(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  // 字符串转义：替换单引号
  return "'" + String(value).replace(/'/g, "''") + "'";
}

/**
 * 导出 agents 表
 */
function exportAgents(db) {
  console.log('📋 导出 agents 表...');
  
  const rows = db.prepare('SELECT * FROM agents ORDER BY created_at').all();
  
  // JSON 格式
  fs.writeFileSync(
    path.join(EXPORT_DIR, 'agents.json'),
    JSON.stringify(rows, null, 2)
  );
  
  // SQL 格式（用于直接导入 Supabase）
  const sql = rows.map(row => {
    // 注意：PostgreSQL 使用 uuid 作为主键，这里需要映射
    return `INSERT INTO agents (agent_id, name, role, description, channel, created_at) VALUES (
      ${escapeSql(row.id)},
      ${escapeSql(row.name)},
      ${escapeSql(row.role)},
      ${escapeSql(row.description)},
      ${escapeSql(row.channel)},
      ${escapeSql(row.created_at)}
    ) ON CONFLICT (agent_id) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      description = EXCLUDED.description,
      channel = EXCLUDED.channel;`;
  }).join('\n');
  
  return { rows, sql, count: rows.length };
}

/**
 * 导出 interactions 表
 */
function exportInteractions(db) {
  console.log('💬 导出 interactions 表...');
  
  const rows = db.prepare('SELECT * FROM interactions ORDER BY created_at').all();
  
  // JSON 格式
  fs.writeFileSync(
    path.join(EXPORT_DIR, 'interactions.json'),
    JSON.stringify(rows, null, 2)
  );
  
  // SQL 格式
  const sql = rows.map(row => {
    return `INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at) VALUES (
      ${escapeSql(row.agent_id)},
      ${escapeSql(row.channel)},
      ${escapeSql(row.message_preview)},
      ${escapeSql(row.message_count)},
      ${escapeSql(row.created_at)}
    );`;
  }).join('\n');
  
  return { rows, sql, count: rows.length };
}

/**
 * 导出 projects 表
 */
function exportProjects(db) {
  console.log('📁 导出 projects 表...');
  
  const rows = db.prepare('SELECT * FROM projects ORDER BY created_at').all();
  
  // JSON 格式
  fs.writeFileSync(
    path.join(EXPORT_DIR, 'projects.json'),
    JSON.stringify(rows, null, 2)
  );
  
  // SQL 格式
  const sql = rows.map(row => {
    return `INSERT INTO projects (name, description, status, agent_ids, created_at, updated_at) VALUES (
      ${escapeSql(row.name)},
      ${escapeSql(row.description)},
      ${escapeSql(row.status)},
      ${escapeSql(row.agent_ids)},
      ${escapeSql(row.created_at)},
      ${escapeSql(row.updated_at)}
    );`;
  }).join('\n');
  
  return { rows, sql, count: rows.length };
}

/**
 * 导出 routing_logs 表
 */
function exportRoutingLogs(db) {
  console.log('🎯 导出 routing_logs 表...');
  
  const rows = db.prepare('SELECT * FROM routing_logs ORDER BY created_at').all();
  
  // JSON 格式
  fs.writeFileSync(
    path.join(EXPORT_DIR, 'routing_logs.json'),
    JSON.stringify(rows, null, 2)
  );
  
  // SQL 格式
  const sql = rows.map(row => {
    return `INSERT INTO routing_logs (input_text, recommended_agent_id, recommended_score, user_selected_agent_id, was_accepted, created_at) VALUES (
      ${escapeSql(row.input_text)},
      ${escapeSql(row.recommended_agent_id)},
      ${escapeSql(row.recommended_score)},
      ${escapeSql(row.user_selected_agent_id)},
      ${escapeSql(row.was_accepted)},
      ${escapeSql(row.created_at)}
    );`;
  }).join('\n');
  
  return { rows, sql, count: rows.length };
}

/**
 * 生成完整的迁移 SQL 文件
 */
function generateMigrationSql(results) {
  console.log('📝 生成迁移 SQL 文件...');
  
  const header = `-- Helix Mirror 数据迁移 SQL
-- 生成时间: ${new Date().toISOString()}
-- 来源: SQLite (local)
-- 目标: PostgreSQL (Supabase)

-- 禁用外键检查（如有需要）
-- SET session_replication_role = replica;

BEGIN;

`;

  const footer = `

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
`;

  const fullSql = header + 
    '-- === Agents ===\n' + results.agents.sql + '\n\n' +
    '-- === Interactions ===\n' + results.interactions.sql + '\n\n' +
    '-- === Projects ===\n' + results.projects.sql + '\n\n' +
    '-- === Routing Logs ===\n' + results.routingLogs.sql + '\n' +
    footer;
  
  fs.writeFileSync(path.join(EXPORT_DIR, 'migration.sql'), fullSql);
}

/**
 * 生成 Prisma Seed 脚本
 * 用于在 Prisma migrate 后自动导入数据
 */
function generatePrismaSeed(results) {
  console.log('🌱 生成 Prisma Seed 脚本...');
  
  const seedScript = `/**
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
  const agents = ${JSON.stringify(results.agents.rows.map(r => ({
    agentId: r.id,
    name: r.name,
    role: r.role,
    description: r.description,
    channel: r.channel,
    createdAt: r.created_at,
  })), null, 2)};
  
  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { agentId: agent.agentId },
      update: agent,
      create: agent,
    });
  }
  console.log(\`✅ 导入 \${agents.length} 个 Agents\`);

  // 导入 Interactions
  const interactions = ${JSON.stringify(results.interactions.rows.map(r => ({
    agentId: r.agent_id,
    channel: r.channel,
    messagePreview: r.message_preview,
    messageCount: r.message_count,
    createdAt: r.created_at,
  })), null, 2)};
  
  for (const interaction of interactions) {
    await prisma.interaction.create({ data: interaction });
  }
  console.log(\`✅ 导入 \${interactions.length} 条 Interactions\`);

  // 导入 Projects
  const projects = ${JSON.stringify(results.projects.rows.map(r => ({
    name: r.name,
    description: r.description,
    status: r.status,
    agentIds: r.agent_ids,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  })), null, 2)};
  
  for (const project of projects) {
    await prisma.project.create({ data: project });
  }
  console.log(\`✅ 导入 \${projects.length} 个 Projects\`);

  // 导入 Routing Logs
  const routingLogs = ${JSON.stringify(results.routingLogs.rows.map(r => ({
    inputText: r.input_text,
    recommendedAgentId: r.recommended_agent_id,
    recommendedScore: r.recommended_score,
    userSelectedAgentId: r.user_selected_agent_id,
    wasAccepted: r.was_accepted,
    createdAt: r.created_at,
  })), null, 2)};
  
  for (const log of routingLogs) {
    await prisma.routingLog.create({ data: log });
  }
  console.log(\`✅ 导入 \${routingLogs.length} 条 Routing Logs\`);

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
`;

  fs.writeFileSync(path.join(EXPORT_DIR, 'seed.js'), seedScript);
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 Helix Mirror 数据导出工具\n');
  console.log('SQLite → Supabase PostgreSQL\n');
  
  // 检查数据库文件
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ 错误：找不到数据库文件', DB_PATH);
    console.log('请先运行 npm run db:init 初始化本地数据库');
    process.exit(1);
  }
  
  // 确保导出目录
  ensureExportDir();
  
  // 连接数据库
  const db = new Database(DB_PATH);
  
  try {
    // 导出各表
    const results = {
      agents: exportAgents(db),
      interactions: exportInteractions(db),
      projects: exportProjects(db),
      routingLogs: exportRoutingLogs(db),
    };
    
    // 生成迁移 SQL
    generateMigrationSql(results);
    
    // 生成 Prisma Seed 脚本
    generatePrismaSeed(results);
    
    // 统计报告
    console.log('\n📊 导出统计：');
    console.log(`   Agents:        ${results.agents.count} 条`);
    console.log(`   Interactions:  ${results.interactions.count} 条`);
    console.log(`   Projects:      ${results.projects.count} 条`);
    console.log(`   Routing Logs:  ${results.routingLogs.count} 条`);
    
    console.log('\n📁 导出文件：');
    console.log(`   ${path.join(EXPORT_DIR, 'agents.json')}`);
    console.log(`   ${path.join(EXPORT_DIR, 'interactions.json')}`);
    console.log(`   ${path.join(EXPORT_DIR, 'projects.json')}`);
    console.log(`   ${path.join(EXPORT_DIR, 'routing_logs.json')}`);
    console.log(`   ${path.join(EXPORT_DIR, 'migration.sql')}`);
    console.log(`   ${path.join(EXPORT_DIR, 'seed.js')}`);
    
    console.log('\n✅ 导出完成！');
    console.log('\n下一步：');
    console.log('1. 在 Supabase 创建项目');
    console.log('2. 运行 npx prisma migrate dev 创建表');
    console.log('3. 复制 data/export/migration.sql 到 Supabase SQL Editor 执行');
    console.log('   或运行: node data/export/seed.js');
    
  } finally {
    db.close();
  }
}

// 执行
main().catch(console.error);
