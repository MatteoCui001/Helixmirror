/**
 * Agent 识别配置模块 (JavaScript 版本)
 * 
 * 用途：供 Node.js 脚本直接使用
 */

/**
 * Agent 识别规则库
 */
const AGENT_IDENTITY_RULES = [
  {
    id: 'main',
    name: 'Main',
    channel: '飞书',
    keywords: [
      '任务', '日程', '安排', '提醒', '待办', '会议',
      '配置', '设置', '日常', '飞书', '健康检查',
      'heartbeat', '系统状态'
    ],
    messagePrefixes: ['收到', '已发送', '✅', '---'],
    fallbackScore: 10
  },
  {
    id: 'craft',
    name: 'Craft',
    channel: 'Discord',
    keywords: [
      '代码', '开发', 'bug', '修复', '编程', 'api',
      '数据库', '前端', '后端', 'react', 'next',
      'typescript', 'git', '部署', 'claude', 'npm',
      '构建', '编译', '脚本', 'sync', 'helix mirror'
    ],
    messagePrefixes: ['好的', '请', '我会', '开始', '完成'],
    fallbackScore: 8
  },
  {
    id: 'alpha',
    name: 'Alpha',
    channel: 'Discord',
    keywords: [
      '股票', '投资', '持仓', '财报', '分析',
      '市场', '特斯拉', 'tsla', '理财', '基金',
      '加密货币', '比特币', '价格', '涨跌',
      'portfolio', 'trading', 'stock'
    ],
    messagePrefixes: ['分析', '建议', '看好', '谨慎'],
    fallbackScore: 6
  },
  {
    id: 'helix',
    name: 'Helix',
    channel: 'Discord',
    keywords: [
      'discord', '频道', '消息', '通知',
      'general', 'random', '帮助'
    ],
    messagePrefixes: ['你好', '您好', 'hi', 'hello'],
    fallbackScore: 4
  }
];

/**
 * 根据消息内容识别 Agent
 */
function identifyAgentByMessage(message, channel) {
  // 飞书渠道直接返回 Main
  if (channel === '飞书') {
    return { agentId: 'main', confidence: 1.0 };
  }
  
  // Discord 渠道需要分析内容
  const candidates = AGENT_IDENTITY_RULES.filter(r => r.channel === 'Discord');
  const normalizedMessage = message.trim().toLowerCase();
  const normalizedRawMessage = message.trim();
  
  let bestMatch = { agentId: 'helix', score: 0, confidence: 0 };
  
  for (const rule of candidates) {
    let score = 0;
    
    // 关键词匹配
    for (const keyword of rule.keywords) {
      const normalizedKeyword = keyword.trim().toLowerCase();

      if (normalizedMessage.includes(normalizedKeyword)) {
        score += 10;
        if (normalizedMessage.startsWith(normalizedKeyword)) {
          score += 5;
        }
      }
    }
    
    // 前缀匹配
    for (const prefix of rule.messagePrefixes) {
      const normalizedPrefix = prefix.trim().toLowerCase();

      if (normalizedMessage.startsWith(normalizedPrefix) || normalizedRawMessage.startsWith(prefix.trim())) {
        score += 8;
      }
    }
    
    score += rule.fallbackScore;
    
    if (score > bestMatch.score) {
      bestMatch = { 
        agentId: rule.id, 
        score,
        confidence: Math.min(score / 50, 1.0)
      };
    }
  }
  
  return { agentId: bestMatch.agentId, confidence: bestMatch.confidence };
}

/**
 * 从 workspace 目录识别 Agent
 */
function identifyAgentByWorkspace(dirName) {
  const map = {
    'workspace': { id: 'main', name: 'Main', channel: '飞书' },
    'workspace-craft': { id: 'craft', name: 'Craft', channel: 'Discord' },
    'workspace-alpha': { id: 'alpha', name: 'Alpha', channel: 'Discord' },
    'workspace-helix': { id: 'helix', name: 'Helix', channel: 'Discord' }
  };
  
  return map[dirName] || null;
}

/**
 * 获取 Agent 信息
 */
function getAgentInfo(agentId) {
  return AGENT_IDENTITY_RULES.find(r => r.id === agentId);
}

module.exports = {
  AGENT_IDENTITY_RULES,
  identifyAgentByMessage,
  identifyAgentByWorkspace,
  getAgentInfo
};
