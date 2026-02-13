/**
 * 自动同步脚本 (改进版)
 * 
 * 用途：自动将 OpenClaw 的真实数据导入 Helix Mirror 数据库
 * 
 * 改进：
 * - 使用新的 Agent 识别配置
 * - 支持 Discord 多 Agent 区分
 * - 显示识别置信度统计
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { identifyAgentByMessage, getAgentInfo } = require('./lib/agent-config');

const DB_PATH = path.join(__dirname, '..', 'data', 'helix.db');

/**
 * 获取已存在的时间戳
 */
function getExistingTimestamps(db) {
  const query = db.prepare('SELECT created_at FROM interactions ORDER BY created_at DESC LIMIT 1000');
  const rows = query.all();
  return rows.map((row) => new Date(row.created_at));
}

/**
 * 解析 gateway.log（改进版 Agent 识别）
 */
function parseGatewayLog(logPath) {
  const interactions = [];
  
  if (!fs.existsSync(logPath)) {
    console.warn(`⚠️ 日志文件不存在: ${logPath}`);
    return interactions;
  }
  
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');
  
  // 聚合消息（5分钟窗口）
  let currentBatch = null;
  const batches = [];
  
  for (const line of lines) {
    const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+\[(\w+)\]/);
    if (!match) continue;
    
    const timestamp = new Date(match[1]);
    const channel = match[2] === 'feishu' ? '飞书' : 'Discord';
    
    const textMatch = line.match(/deliver called:\s*text=(.+)$/);
    if (!textMatch) continue;
    
    const message = textMatch[1].trim();
    
    if (currentBatch && 
        channel === currentBatch.channel &&
        (timestamp.getTime() - currentBatch.timestamp.getTime()) < 5 * 60 * 1000) {
      currentBatch.messages.push(message);
    } else {
      if (currentBatch) batches.push(currentBatch);
      currentBatch = { timestamp, messages: [message], channel };
    }
  }
  
  if (currentBatch) batches.push(currentBatch);
  
  // 转换为交互记录（使用新的识别逻辑）
  for (const batch of batches) {
    if (batch.messages.length === 0) continue;
    
    const fullContent = batch.messages.join(' ');
    
    // 使用新的 Agent 识别
    const identification = identifyAgentByMessage(fullContent, batch.channel);
    const agent = getAgentInfo(identification.agentId);
    
    const preview = batch.messages[0].slice(0, 100) + 
      (batch.messages[0].length > 100 ? '...' : '');
    
    interactions.push({
      agentId: identification.agentId,
      agentName: agent?.name || 'Unknown',
      channel: batch.channel,
      messagePreview: preview,
      messageCount: batch.messages.length,
      timestamp: batch.timestamp,
      source: logPath,
      confidence: identification.confidence
    });
  }
  
  return interactions;
}

/**
 * 过滤已存在记录
 */
function filterNewInteractions(interactions, existingTimestamps) {
  return interactions.filter(interaction => {
    const timeExists = existingTimestamps.some(existing => 
      Math.abs(existing.getTime() - interaction.timestamp.getTime()) < 60 * 1000
    );
    return !timeExists;
  });
}

/**
 * 插入记录
 */
function insertInteraction(db, interaction) {
  const insert = db.prepare(`
    INSERT INTO interactions (agent_id, channel, message_preview, message_count, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  return insert.run(
    interaction.agentId,
    interaction.channel,
    interaction.messagePreview,
    interaction.messageCount,
    interaction.timestamp.toISOString()
  ).lastInsertRowid;
}

/**
 * 主同步函数
 */
async function syncData(dryRun = false) {
  console.log('🔄 Helix Mirror 自动同步 (改进版)\n');
  console.log(`模式: ${dryRun ? '预览' : '写入'}\n`);
  
  const db = new Database(DB_PATH);
  
  try {
    const logPath = path.join(process.env.HOME, '.openclaw', 'logs', 'gateway.log');
    
    console.log('📥 正在解析 OpenClaw 日志...');
    const interactions = parseGatewayLog(logPath);
    console.log(`   找到 ${interactions.length} 条记录\n`);
    
    if (interactions.length === 0) {
      console.log('⚠️ 没有找到可导入的数据');
      return;
    }
    
    // 显示识别统计
    const stats = {};
    for (const i of interactions) {
      stats[i.agentId] = (stats[i.agentId] || 0) + 1;
    }
    console.log('📊 Agent 识别统计:');
    for (const [agent, count] of Object.entries(stats)) {
      console.log(`   ${agent}: ${count} 条`);
    }
    console.log();
    
    // 检查现有数据
    const existingTimestamps = getExistingTimestamps(db);
    const newInteractions = filterNewInteractions(interactions, existingTimestamps);
    
    console.log(`🆕 新记录: ${newInteractions.length} 条\n`);
    
    if (newInteractions.length === 0) {
      console.log('✅ 无需同步');
      return;
    }
    
    if (dryRun) {
      console.log('📋 预览 - 将导入:');
      for (const i of newInteractions.slice(0, 5)) {
        console.log(`   [${i.agentName}] ${i.timestamp.toLocaleString('zh-CN')} (${(i.confidence * 100).toFixed(0)}%)`);
      }
      if (newInteractions.length > 5) {
        console.log(`   ... 还有 ${newInteractions.length - 5} 条`);
      }
      return;
    }
    
    // 执行导入
    console.log('💾 正在写入数据库...\n');
    let successCount = 0;
    
    for (const interaction of newInteractions) {
      try {
        insertInteraction(db, interaction);
        successCount++;
      } catch (error) {
        console.error(`❌ 失败:`, error.message);
      }
    }
    
    console.log(`\n✅ 同步完成！成功导入 ${successCount} 条`);
    
  } finally {
    db.close();
  }
}

// 执行
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');
syncData(dryRun).catch(error => {
  console.error('❌ 错误:', error);
  process.exit(1);
});
