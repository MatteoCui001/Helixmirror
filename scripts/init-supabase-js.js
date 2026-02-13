/**
 * Supabase 初始化脚本 - 使用 JS API
 * 
 * 用途：
 * - 通过 Supabase JS API 连接
 * - 创建表结构
 * - 导入数据
 * 
 * 注意：
 * - 使用 publishable key 连接，权限可能受限
 * - 如果权限不足，需要通过 Supabase Dashboard 手动开启
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 配置
const SUPABASE_URL = 'https://iqvoitnkhwxppayabafr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1MAYhosssYcBnCPKQ5KgGg_vOBJuFgt';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 检查连接
 */
async function checkConnection() {
  console.log('📡 测试 Supabase 连接...');
  try {
    const { data, error } = await supabase.from('agents').select('count');
    if (error && error.code === 'PGRST116') {
      console.log('⚠️ 表不存在，需要创建');
      return false;
    }
    if (error) {
      console.log('❌ 连接错误:', error.message);
      return false;
    }
    console.log('✅ 连接成功');
    return true;
  } catch (e) {
    console.log('❌ 连接失败:', e.message);
    return false;
  }
}

/**
 * 尝试导入 Agents
 */
async function importAgents() {
  console.log('👤 导入 Agents...');
  
  const agents = [
    { agent_id: 'main', name: 'Main', role: '主助手', channel: '飞书', description: 'OpenClaw 主渠道，日常对话和任务协调' },
    { agent_id: 'craft', name: 'Craft', role: '代码助手', channel: 'Discord', description: '编程和技术开发相关' },
    { agent_id: 'alpha', name: 'Alpha', role: '投资助手', channel: 'Discord', description: '投资组合和市场分析' },
    { agent_id: 'helix', name: 'Helix', role: 'Discord助手', channel: 'Discord', description: 'Discord 通用助手' },
  ];
  
  try {
    const { data, error } = await supabase
      .from('agents')
      .upsert(agents, { onConflict: 'agent_id' });
    
    if (error) {
      console.log('❌ 导入失败:', error.message);
      return false;
    }
    console.log(`✅ 导入 ${agents.length} 个 Agents`);
    return true;
  } catch (e) {
    console.log('❌ 导入错误:', e.message);
    return false;
  }
}

/**
 * 尝试导入 Interactions
 */
async function importInteractions() {
  console.log('💬 导入 Interactions...');
  
  const interactionsPath = path.join(__dirname, '..', 'data', 'export', 'interactions.json');
  if (!fs.existsSync(interactionsPath)) {
    console.log('⚠️ 未找到 interactions 数据');
    return false;
  }
  
  const interactions = JSON.parse(fs.readFileSync(interactionsPath, 'utf-8'));
  
  // 批量插入（每次 100 条）
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < interactions.length; i += batchSize) {
    const batch = interactions.slice(i, i + batchSize).map(item => ({
      agent_id: item.agent_id,
      channel: item.channel,
      message_preview: item.message_preview,
      message_count: item.message_count,
      created_at: item.created_at,
    }));
    
    try {
      const { error } = await supabase.from('interactions').insert(batch);
      if (error) {
        console.log(`❌ 批次 ${i/batchSize + 1} 失败:`, error.message);
        continue;
      }
      inserted += batch.length;
      console.log(`✅ 导入批次 ${i/batchSize + 1}: ${batch.length} 条`);
    } catch (e) {
      console.log(`❌ 批次错误:`, e.message);
    }
  }
  
  console.log(`✅ 共导入 ${inserted} 条 Interactions`);
  return inserted > 0;
}

/**
 * 验证数据
 */
async function verifyData() {
  console.log('\n📊 数据验证：');
  
  const tables = ['agents', 'interactions', 'projects', 'routing_logs'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ${table}: ❌ ${error.message}`);
      } else {
        console.log(`   ${table}: ${count} 条`);
      }
    } catch (e) {
      console.log(`   ${table}: ❌ ${e.message}`);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 Supabase 初始化 (JS API 方式)\n');
  
  // 检查连接
  const connected = await checkConnection();
  
  if (!connected) {
    console.log('\n⚠️ 提示：表可能不存在，需要先在 Supabase Dashboard 创建');
    console.log('或者 publishable key 权限不足，需要 service_role key');
    console.log('\n继续尝试导入...\n');
  }
  
  // 尝试导入数据
  await importAgents();
  await importInteractions();
  
  // 验证
  await verifyData();
  
  console.log('\n✅ 初始化完成');
  console.log('\n如果导入失败，请：');
  console.log('1. 在 Supabase Dashboard 运行 create-tables.sql');
  console.log('2. 获取 service_role key 后重试');
}

main().catch(console.error);
