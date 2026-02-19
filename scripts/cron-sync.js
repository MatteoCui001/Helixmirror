/**
 * 定时同步任务脚本（带重试 + 告警 + 状态持久化）
 *
 * 用途：每小时自动运行数据同步，并维护可观测状态文件
 *
 * 使用方法：
 *   node scripts/cron-sync.js
 *
 * 可选环境变量：
 * - SYNC_MAX_RETRIES=3
 * - SYNC_ALERT_WEBHOOK=https://example.com/webhook
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'data', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'sync.log');
const STATUS_FILE = path.join(LOG_DIR, 'sync-status.json');
const NODE_PATH = process.execPath;
const MAX_RETRIES = Number.parseInt(process.env.SYNC_MAX_RETRIES || '3', 10);

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  console.log(message);
  ensureLogDir();
  fs.appendFileSync(LOG_FILE, line);
}

function cleanOldLogs() {
  if (!fs.existsSync(LOG_FILE)) return;

  const stats = fs.statSync(LOG_FILE);
  const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceModified <= 7) return;

  const backupName = `sync-${new Date().toISOString().slice(0, 10)}.log`;
  const backupPath = path.join(LOG_DIR, backupName);
  fs.renameSync(LOG_FILE, backupPath);
  log(`📦 旧日志已备份: ${backupName}`);
}

function parseImportedCount(output) {
  const match = output.match(/成功导入\s+(\d+)\s+条/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function summarizeError(rawOutput) {
  const text = String(rawOutput || '').trim();
  if (!text) return '未知错误';
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  return lines.slice(-3).join(' | ').slice(0, 600);
}

function runSyncOnce() {
  const scriptPath = path.join(__dirname, 'auto-sync.js');
  const startedAt = Date.now();

  try {
    const output = execSync(`"${NODE_PATH}" "${scriptPath}"`, {
      encoding: 'utf-8',
      timeout: 120000,
      cwd: path.join(__dirname, '..'),
    });

    return {
      success: true,
      output,
      durationMs: Date.now() - startedAt,
      importedCount: parseImportedCount(output),
      errorSummary: '',
    };
  } catch (error) {
    const output = error.stdout || error.stderr || error.message || '未知错误';
    return {
      success: false,
      output,
      durationMs: Date.now() - startedAt,
      importedCount: 0,
      errorSummary: summarizeError(output),
    };
  }
}

function runSyncWithRetries() {
  let lastResult = null;
  for (let attempt = 1; attempt <= Math.max(1, MAX_RETRIES); attempt++) {
    log(`🔁 同步尝试 ${attempt}/${Math.max(1, MAX_RETRIES)}`);
    const result = runSyncOnce();
    lastResult = { ...result, attempts: attempt };

    if (result.success) {
      return lastResult;
    }

    log(`⚠️ 尝试 ${attempt} 失败: ${result.errorSummary}`);
  }

  return lastResult;
}

function loadStatus() {
  ensureLogDir();
  if (!fs.existsSync(STATUS_FILE)) {
    return {
      lastRunAt: null,
      lastSuccessAt: null,
      consecutiveFailures: 0,
      lastDurationMs: null,
      lastImportedCount: 0,
      lastStatus: 'unknown',
      lastError: '',
      recentRuns: [],
    };
  }

  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
  } catch {
    return {
      lastRunAt: null,
      lastSuccessAt: null,
      consecutiveFailures: 0,
      lastDurationMs: null,
      lastImportedCount: 0,
      lastStatus: 'unknown',
      lastError: '状态文件损坏，已自动重建',
      recentRuns: [],
    };
  }
}

function saveStatus(status) {
  ensureLogDir();
  const temp = `${STATUS_FILE}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(status, null, 2)}\n`, 'utf-8');
  fs.renameSync(temp, STATUS_FILE);
}

function updateStatus(result) {
  const status = loadStatus();
  const now = new Date().toISOString();

  status.lastRunAt = now;
  status.lastDurationMs = result.durationMs;
  status.lastImportedCount = result.importedCount;
  status.lastStatus = result.success ? 'success' : 'failed';
  status.lastError = result.success ? '' : result.errorSummary;

  if (result.success) {
    status.lastSuccessAt = now;
    status.consecutiveFailures = 0;
  } else {
    status.consecutiveFailures = (status.consecutiveFailures || 0) + 1;
  }

  status.recentRuns = [
    {
      runAt: now,
      success: result.success,
      attempts: result.attempts,
      durationMs: result.durationMs,
      importedCount: result.importedCount,
      error: result.errorSummary || '',
    },
    ...(status.recentRuns || []).slice(0, 19),
  ];

  saveStatus(status);
  return status;
}

async function sendAlert(result, status) {
  const webhook = process.env.SYNC_ALERT_WEBHOOK;
  const alertMessage = `SYNC ALERT: 同步失败，连续失败 ${status.consecutiveFailures} 次，错误: ${result.errorSummary}`;

  log(`🚨 ${alertMessage}`);

  if (!webhook) {
    return;
  }

  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'helix-sync-failure',
        message: alertMessage,
        timestamp: new Date().toISOString(),
        data: {
          consecutiveFailures: status.consecutiveFailures,
          attempts: result.attempts,
          durationMs: result.durationMs,
          error: result.errorSummary,
        },
      }),
    });

    if (!response.ok) {
      log(`⚠️ 告警 webhook 调用失败: HTTP ${response.status}`);
    } else {
      log('📨 告警已发送');
    }
  } catch (error) {
    log(`⚠️ 告警发送异常: ${error.message}`);
  }
}

async function main() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('🕐 定时同步任务开始');
  log(`⏰ ${new Date().toLocaleString('zh-CN')}`);
  log(`🖥️  Node: ${NODE_PATH}`);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  cleanOldLogs();

  const result = runSyncWithRetries();
  const status = updateStatus(result);

  if (result.success) {
    log(`✅ 定时同步成功，导入 ${result.importedCount} 条，耗时 ${result.durationMs}ms`);
  } else {
    log(`❌ 定时同步失败（已重试 ${result.attempts} 次）`);
    log(result.errorSummary);
    await sendAlert(result, status);
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((error) => {
  log(`❌ 定时任务异常退出: ${error.message}`);
  process.exit(1);
});
