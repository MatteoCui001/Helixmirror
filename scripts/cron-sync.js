/**
 * 定时同步任务脚本
 * 
 * 用途：每小时自动运行数据同步
 * 
 * 使用方法：
 *   node scripts/cron-sync.js
 * 
 * 可以配合系统定时任务使用：
 *   # crontab -e
 *   0 * * * * cd ~/Projects/helix-mirror && /opt/homebrew/bin/node scripts/cron-sync.js
 * 
 * 或使用 macOS launchd
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'data', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'sync.log');

// 使用完整的 node 路径，避免环境变量问题
const NODE_PATH = process.execPath; // 当前运行的 node 可执行文件路径

/**
 * 确保日志目录存在
 */
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * 写入日志
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  
  // 输出到控制台
  console.log(message);
  
  // 写入文件
  ensureLogDir();
  fs.appendFileSync(LOG_FILE, logLine);
}

/**
 * 运行同步脚本
 */
function runSync() {
  const scriptPath = path.join(__dirname, 'auto-sync.js');
  
  try {
    // 使用 process.execPath 确保使用同一个 node 实例
    const output = execSync(`"${NODE_PATH}" "${scriptPath}"`, {
      encoding: 'utf-8',
      timeout: 60000,  // 1分钟超时
      cwd: path.join(__dirname, '..')
    });
    
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || error.message || '未知错误'
    };
  }
}

/**
 * 清理旧日志（保留最近 7 天）
 */
function cleanOldLogs() {
  if (!fs.existsSync(LOG_FILE)) return;
  
  const stats = fs.statSync(LOG_FILE);
  const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceModified > 7) {
    // 备份旧日志
    const backupName = `sync-${new Date().toISOString().split('T')[0]}.log`;
    const backupPath = path.join(LOG_DIR, backupName);
    fs.renameSync(LOG_FILE, backupPath);
    log(`📦 旧日志已备份: ${backupName}`);
  }
}

/**
 * 主函数
 */
function main() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🕐 定时同步任务开始');
  log(`⏰ ${new Date().toLocaleString('zh-CN')}`);
  log(`🖥️  Node: ${NODE_PATH}`);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // 清理旧日志
  cleanOldLogs();
  
  // 运行同步
  const result = runSync();
  
  if (result.success) {
    log('\n✅ 定时同步成功完成');
  } else {
    log('\n❌ 定时同步失败');
    log(result.output);
  }
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 执行
main();
