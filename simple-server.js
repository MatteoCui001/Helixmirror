/**
 * Helix Mirror 零依赖版本
 * 
 * 用途：不依赖任何 npm 包，直接用系统 SQLite 运行
 * 
 * 原理：
 * - 用 child_process 执行 sqlite3 命令行工具
 * - 解析 CSV 输出为 JSON
 * - 生成纯 HTML 页面
 */

const http = require('http');
const { execSync } = require('child_process');
const path = require('path');

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'data', 'helix.db');

/**
 * 执行 SQL 查询并返回结果
 * 使用 sqlite3 命令行工具的 CSV 模式
 */
function query(sql) {
  try {
    const cmd = `sqlite3 -json "${DB_PATH}" "${sql.replace(/"/g, '\\"')}"`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    return JSON.parse(output || '[]');
  } catch (err) {
    console.error('Query error:', err.message);
    return [];
  }
}

/**
 * 获取仪表盘数据
 */
function getDashboardData() {
  // Agent 统计
  const agentStats = query(`
    SELECT 
      a.id, a.name, a.role,
      COALESCE((SELECT COUNT(*) FROM interactions 
                WHERE agent_id = a.id AND date(created_at) = date('now')), 0) as todayInteractions,
      COALESCE((SELECT COUNT(*) FROM interactions WHERE agent_id = a.id), 0) as totalInteractions,
      (SELECT MAX(created_at) FROM interactions WHERE agent_id = a.id) as lastActive
    FROM agents a
    ORDER BY todayInteractions DESC
  `);
  
  // 今日概览
  const todayResult = query(`
    SELECT 
      COALESCE(SUM(message_count), 0) as totalMessages,
      COUNT(DISTINCT agent_id) as activeAgents,
      COUNT(*) as totalInteractions
    FROM interactions WHERE date(created_at) = date('now')
  `);
  const todayOverview = todayResult[0] || { totalMessages: 0, activeAgents: 0, totalInteractions: 0 };
  
  // 最近活动
  const recentActivities = query(`
    SELECT i.id, a.name as agentName, a.role as agentRole,
           i.channel, i.message_preview as messagePreview, i.created_at as createdAt
    FROM interactions i JOIN agents a ON i.agent_id = a.id
    ORDER BY i.created_at DESC LIMIT 10
  `);
  
  return { agentStats, todayOverview, recentActivities };
}

/**
 * 格式化相对时间
 */
function formatTime(dateStr) {
  if (!dateStr) return '从未';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMins = Math.floor((now - date) / 60000);
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} 小时前`;
  return date.toLocaleDateString('zh-CN');
}

/**
 * 获取 Agent 颜色样式
 */
function getAgentStyle(role) {
  if (role === '代码助手') return 'border-blue-500 bg-blue-900/20';
  if (role === '投资助手') return 'border-green-500 bg-green-900/20';
  if (role === '主助手') return 'border-purple-500 bg-purple-900/20';
  return 'border-gray-500 bg-gray-800';
}

/**
 * 生成 HTML 页面
 */
function generateHTML(data) {
  const { agentStats, todayOverview, recentActivities } = data;
  
  // Agent 卡片
  const agentCards = agentStats.map(agent => `
    <div class="${getAgentStyle(agent.role)} border rounded-lg p-4">
      <div class="flex justify-between items-start mb-2">
        <div>
          <h3 class="text-lg font-bold text-white">${agent.name}</h3>
          <span class="text-xs text-gray-400">${agent.role}</span>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-white">${agent.todayInteractions}</div>
          <div class="text-xs text-gray-500">今日</div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div class="bg-gray-800/50 rounded p-2">
          <div class="text-gray-500 text-xs">总交互</div>
          <div class="text-white font-semibold">${agent.totalInteractions}</div>
        </div>
        <div class="bg-gray-800/50 rounded p-2">
          <div class="text-gray-500 text-xs">最后活跃</div>
          <div class="text-white font-semibold text-xs">${formatTime(agent.lastActive)}</div>
        </div>
      </div>
    </div>
  `).join('');
  
  // 活动列表
  const activityList = recentActivities.map(act => `
    <div class="border-b border-gray-700 p-3 last:border-0">
      <div class="flex justify-between items-center mb-1">
        <div class="flex items-center space-x-2">
          <span class="font-semibold text-white text-sm">${act.agentName}</span>
          <span class="text-xs text-gray-500">${act.agentRole}</span>
        </div>
        <span class="text-xs text-gray-500">${formatTime(act.createdAt)}</span>
      </div>
      <span class="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-400">${act.channel}</span>
      <p class="text-sm text-gray-400 mt-1 truncate">${act.messagePreview || '无内容'}</p>
    </div>
  `).join('');
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Helix Mirror - Agent 仪表盘</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white min-h-screen">
  <header class="bg-gray-800 border-b border-gray-700">
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">🧬 Helix Mirror</h1>
          <p class="mt-1 text-sm text-gray-400">Agent 交互仪表盘 - 观察、理解、优化你的 AI 助手网络</p>
        </div>
        <div class="text-sm text-gray-400">${new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
    </div>
  </header>
  
  <main class="max-w-6xl mx-auto px-4 py-8">
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4">📊 今日概览</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-900/20 border border-blue-700 rounded-lg p-5 flex items-center space-x-4">
          <div class="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-2xl">💬</div>
          <div>
            <div class="text-gray-400 text-sm">总消息数</div>
            <div class="text-3xl font-bold">${todayOverview.totalMessages}</div>
          </div>
        </div>
        <div class="bg-purple-900/20 border border-purple-700 rounded-lg p-5 flex items-center space-x-4">
          <div class="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-2xl">🤖</div>
          <div>
            <div class="text-gray-400 text-sm">活跃 Agent</div>
            <div class="text-3xl font-bold">${todayOverview.activeAgents}</div>
          </div>
        </div>
        <div class="bg-green-900/20 border border-green-700 rounded-lg p-5 flex items-center space-x-4">
          <div class="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-2xl">📝</div>
          <div>
            <div class="text-gray-400 text-sm">对话次数</div>
            <div class="text-3xl font-bold">${todayOverview.totalInteractions}</div>
          </div>
        </div>
      </div>
    </section>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <section class="lg:col-span-2">
        <h2 class="text-lg font-semibold mb-4">🤖 Agent 状态</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${agentCards}
        </div>
      </section>
      
      <section>
        <h2 class="text-lg font-semibold mb-4">🕐 最近活动</h2>
        <div class="bg-gray-800 rounded-lg overflow-hidden">
          ${recentActivities.length ? activityList : '<div class="p-6 text-center text-gray-500">暂无活动记录</div>'}
        </div>
      </section>
    </div>
  </main>
  
  <footer class="max-w-6xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
    Helix Mirror v0.1.0 - 零依赖版本
  </footer>
</body>
</html>`;
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    try {
      const data = getDashboardData();
      const html = generateHTML(data);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error: ' + err.message);
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log('\n🧬 Helix Mirror 已启动！');
  console.log(`📊 访问地址: http://localhost:${PORT}`);
  console.log('\n按 Ctrl+C 停止服务器\n');
});
