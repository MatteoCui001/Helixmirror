/**
 * 数据同步脚本 - 从 OpenClaw 导入交互记录
 * 
 * 用途：手动将 OpenClaw 的对话记录导入到 Helix Mirror 数据库
 * 
 * 使用方法：
 *   node scripts/sync-data.js [agent_id] [channel] "消息预览" [消息数量]
 * 
 * 示例：
 *   node scripts/sync-data.js craft Discord "完成 Helix Mirror Phase 1.5 开发" 5
 *   node scripts/sync-data.js main 飞书 "配置飞书 Bridge" 3
 */

const Database = require('better-sqlite3');
const path = require('path');

// 数据库路径
const DB_PATH = path.join(__dirname, '..', 'data', 'helix.db');

/**
 * 显示使用说明
 */
function showUsage() {
  console.log(`
🔄 Helix Mirror 数据同步脚本

用法：
  node scripts/sync-data.js [agent_id] [channel] "消息预览" [消息数量]

参数：
  agent_id      Agent 标识：main | craft | alpha | helix
  channel       渠道名称：Discord | 飞书
  message_preview  消息内容预览（用引号包裹）
  message_count    消息数量（可选，默认 1）

示例：
  node scripts/sync-data.js craft Discord "讨论架构设计" 5
  node scripts/sync-data.js main 飞书 "日常任务处理"
`);
}

/**
 * 添加单条交互记录
 */
function addInteraction(agentId, channel, messagePreview, messageCount = 1) {
  const db = new Database(DB_PATH);
  
  // 验证 agent_id 是否存在
  const agent = db.prepare('SELECT id, name FROM agents WHERE id = ?').get(agentId);
  if (!agent) {
    console.error(`❌ 错误：Agent "${agentId}" 不存在`);
    console.log('可用的 Agent：main, craft, alpha, helix');
    db.close();
    process.exit(1);
  }

  // 插入记录
  const insert = db.prepare(`
    INSERT INTO interactions (agent_id, channel, message_preview, message_count)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = insert.run(agentId, channel, messagePreview, messageCount);
  
  console.log(`✅ 已添加记录：`);
  console.log(`   Agent: ${agent.name} (${agentId})`);
  console.log(`   渠道: ${channel}`);
  console.log(`   内容: ${messagePreview.slice(0, 50)}${messagePreview.length > 50 ? '...' : ''}`);
  console.log(`   消息数: ${messageCount}`);
  console.log(`   记录ID: ${result.lastInsertRowid}`);
  
  db.close();
}

/**
 * 批量导入示例数据（用于演示）
 */
function importDemoData() {
  const db = new Database(DB_PATH);
  
  console.log('🔄 导入演示数据...\n');
  
  const demoData = [
    { agent: 'craft', channel: 'Discord', preview: '完成 Helix Mirror Phase 1.5 开发', count: 8 },
    { agent: 'main', channel: '飞书', preview: '配置飞书 Bridge 自动同步', count: 5 },
    { agent: 'alpha', channel: 'Discord', preview: '分析特斯拉财报数据', count: 3 },
    { agent: 'craft', channel: 'Discord', preview: '修复 ActivityList 语法错误', count: 2 },
    { agent: 'main', channel: '飞书', preview: '设置定时健康检查', count: 4 },
  ];
  
  const insert = db.prepare(`
    INSERT INTO interactions (agent_id, channel, message_preview, message_count)
    VALUES (?, ?, ?, ?)
  `);
  
  demoData.forEach((item, index) => {
    // 创建不同时间点的记录（最近 5 小时内，每条约 1 小时间隔）
    const hoursAgo = demoData.length - index;
    insert.run(item.agent, item.channel, item.preview, item.count);
    console.log(`✅ ${item.agent}: ${item.preview.slice(0, 40)}`);
  });
  
  console.log(`\n📊 共导入 ${demoData.length} 条记录`);
  db.close();
}

// 主程序
const args = process.argv.slice(2);

if (args.length === 0) {
  showUsage();
  process.exit(0);
}

if (args[0] === '--demo' || args[0] === '-d') {
  importDemoData();
} else if (args.length >= 3) {
  const [agentId, channel, messagePreview, messageCount] = args;
  addInteraction(agentId, channel, messagePreview, parseInt(messageCount) || 1);
} else {
  console.error('❌ 参数不足\n');
  showUsage();
  process.exit(1);
}
