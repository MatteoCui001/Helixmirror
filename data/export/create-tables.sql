-- ===========================================
-- Helix Mirror 数据库初始化脚本
-- 用于 Supabase PostgreSQL
-- 
-- 使用方法：
-- 1. 登录 https://supabase.com
-- 2. 打开 SQL Editor
-- 3. 粘贴此脚本并运行
-- 4. 然后运行 data/export/migration.sql 导入数据
-- ===========================================

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

-- 创建索引 - 加速时间范围查询
CREATE INDEX IF NOT EXISTS idx_interactions_agent_time 
ON interactions(agent_id, created_at);

CREATE INDEX IF NOT EXISTS idx_interactions_created_at 
ON interactions(created_at);

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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_routing_logs_created_at 
ON routing_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_routing_logs_agent 
ON routing_logs(recommended_agent_id);

-- 启用 RLS (Row Level Security) - 安全设置
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_logs ENABLE ROW LEVEL SECURITY;

-- 创建允许所有访问的策略（开发用，生产环境请调整）
CREATE POLICY "Allow all" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all" ON interactions FOR ALL USING (true);
CREATE POLICY "Allow all" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all" ON routing_logs FOR ALL USING (true);

-- 验证表结构
SELECT 'agents' as table_name, COUNT(*) as count FROM agents
UNION ALL
SELECT 'interactions' as table_name, COUNT(*) as count FROM interactions
UNION ALL
SELECT 'projects' as table_name, COUNT(*) as count FROM projects
UNION ALL
SELECT 'routing_logs' as table_name, COUNT(*) as count FROM routing_logs;
