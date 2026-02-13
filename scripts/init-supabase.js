/**
 * Supabase 数据库初始化脚本
 * 
 * 用途：
 * - 直接连接 Supabase PostgreSQL
 * - 创建表结构
 * - 导入数据
 * 
 * 使用方法：
 *   node scripts/init-supabase.js
 * 
 * 注意：
 * - 需要 DATABASE_URL 环境变量
 * - 会删除现有表并重新创建（谨慎使用）
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 数据库连接配置
const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres:jybbug-8pumPo-sajbys@db.iqvoitnkhwxppayabafr.supabase.co:5432/postgres';

/**
 * 创建表结构 SQL
 */
const CREATE_TABLES_SQL = `
-- 创建 agents 表
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  channel TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 interactions 表
CREATE TABLE IF NOT EXISTS interactions (
  id SERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(agent_id),
  channel TEXT NOT NULL,
  message_preview TEXT,
  message_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_interactions_agent_time ON interactions(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at);

-- 创建 projects 表
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  agent_ids TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 routing_logs 表
CREATE TABLE IF NOT EXISTS routing_logs (
  id SERIAL PRIMARY KEY,
  input_text TEXT NOT NULL,
  recommended_agent_id TEXT NOT NULL,
  recommended_score INTEGER,
  user_selected_agent_id TEXT,
  was_accepted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_logs_created_at ON routing_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_routing_logs_agent ON routing_logs(recommended_agent_id);
`;

/**
 * 导入 agents 数据
 */
const AGENTS_DATA = [
  { agent_id: 'main', name: 'Main', role: '主助手', channel: '飞书', description: 'OpenClaw 主渠道，日常对话和任务协调', created_at: '2026-02-11 07:05:02' },
  { agent_id: 'craft', name: 'Craft', role: '代码助手', channel: 'Discord', description: '编程和技术开发相关', created_at: '2026-02-11 07:05:02' },
  { agent_id: 'alpha', name: 'Alpha', role: '投资助手', channel: 'Discord', description: '投资组合和市场分析', created_at: '2026-02-11 07:05:02' },
  { agent_id: 'helix', name: 'Helix', role: 'Discord助手', channel: 'Discord', description: 'Discord 通用助手', created_at: '2026-02-11 07:05:02' },
];

/**
 * 主函数
 */
async function main() {
  console.log('🚀 初始化 Supabase 数据库\n');
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false  // Supabase 需要
    }
  });
  
  try {
    console.log('📡 连接数据库...');
    await client.connect();
    console.log('✅ 连接成功\n');
    
    // 创建表
    console.log('📋 创建表结构...');
    await client.query(CREATE_TABLES_SQL);
    console.log('✅ 表创建完成\n');
    
    // 导入 agents
    console.log('👤 导入 Agents...');
    for (const agent of AGENTS_DATA) {
      await client.query(`
        INSERT INTO agents (agent_id, name, role, description, channel, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (agent_id) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          description = EXCLUDED.description,
          channel = EXCLUDED.channel
      `, [agent.agent_id, agent.name, agent.role, agent.description, agent.channel, agent.created_at]);
    }
    console.log(`✅ 导入 ${AGENTS_DATA.length} 个 Agents\n`);
    
    // 读取并导入 interactions
    console.log('💬 导入 Interactions...');
    const interactionsPath = path.join(__dirname, '..', 'data', 'export', 'interactions.json');
    if (fs.existsSync(interactionsPath)) {
      const interactions = JSON.parse(fs.readFileSync(interactionsPath, 'utf-8'));
      
      for (const item of interactions) {
        await client.query(`
          INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at)
          VALUES ($1, $2, $3, $4, $5)
        `, [item.agent_id, item.channel, item.message_preview, item.message_count, item.created_at]);
      }
      console.log(`✅ 导入 ${interactions.length} 条 Interactions\n`);
    } else {
      console.log('⚠️ 未找到 interactions 数据\n');
    }
    
    // 验证数据
    console.log('📊 数据验证：');
    const result = await client.query(`
      SELECT 'agents' as table_name, COUNT(*) as count FROM agents
      UNION ALL
      SELECT 'interactions' as table_name, COUNT(*) as count FROM interactions
      UNION ALL
      SELECT 'projects' as table_name, COUNT(*) as count FROM projects
      UNION ALL
      SELECT 'routing_logs' as table_name, COUNT(*) as count FROM routing_logs
    `);
    
    for (const row of result.rows) {
      console.log(`   ${row.table_name}: ${row.count} 条`);
    }
    
    console.log('\n🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 提示：请检查网络连接或 Supabase 项目状态');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

// 执行
main();
