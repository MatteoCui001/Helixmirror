/**
 * Agent 识别配置模块
 * 
 * 用途：定义各 Agent 的识别特征和匹配规则
 * 
 * 识别策略（按优先级）：
 * 1. 消息内容关键词匹配（最高优先级）
 * 2. 渠道 + 时间窗口分析
 * 3. 消息前缀/署名
 * 4. 默认 fallback
 * 
 * 为什么需要多策略：
 * - Discord 三个 Agent 共享同一渠道
 * - 单纯靠渠道无法区分
 * - 需要结合内容特征
 */

/**
 * Agent 识别规则配置
 */
export interface AgentIdentityRule {
  id: string;
  name: string;
  channel: '飞书' | 'Discord';
  keywords: string[];      // 内容关键词（权重最高）
  messagePrefixes: string[]; // 常见消息前缀
  description: string;
  fallbackScore: number;   // 默认匹配分数
}

/**
 * Agent 识别规则库
 * 
 * 设计原则：
 * - 关键词覆盖 Agent 的核心职责
 * - 避免关键词重叠导致混淆
 * - 支持中英文关键词
 */
export const AGENT_IDENTITY_RULES: AgentIdentityRule[] = [
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
    description: 'OpenClaw 主渠道，日常对话和任务协调',
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
    description: '编程和技术开发相关',
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
    description: '投资组合和市场分析',
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
    description: 'Discord 通用助手',
    fallbackScore: 4
  }
];

/**
 * 根据消息内容识别 Agent
 * 
 * 算法：
 * 1. 先按渠道过滤（飞书=Main，Discord=多选）
 * 2. 计算每个候选 Agent 的关键词匹配分数
 * 3. 返回分数最高的 Agent
 * 4. 如果分数相同，选择 fallbackScore 高的
 * 
 * @param message 消息内容
 * @param channel 渠道
 * @returns 识别到的 Agent ID 和置信度
 */
export function identifyAgentByMessage(
  message: string,
  channel: string
): { agentId: string; confidence: number } {
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
    
    // 关键词匹配（每个 +10 分）
    for (const keyword of rule.keywords) {
      const normalizedKeyword = keyword.trim().toLowerCase();

      if (normalizedMessage.includes(normalizedKeyword)) {
        score += 10;
        // 关键词出现在开头额外加分
        if (normalizedMessage.startsWith(normalizedKeyword)) {
          score += 5;
        }
      }
    }
    
    // 消息前缀匹配（每个 +8 分）
    for (const prefix of rule.messagePrefixes) {
      const normalizedPrefix = prefix.trim().toLowerCase();

      if (normalizedMessage.startsWith(normalizedPrefix) || normalizedRawMessage.startsWith(prefix.trim())) {
        score += 8;
      }
    }
    
    // 加上默认分数
    score += rule.fallbackScore;
    
    // 更新最佳匹配
    if (score > bestMatch.score) {
      bestMatch = { 
        agentId: rule.id, 
        score,
        confidence: Math.min(score / 50, 1.0)  // 最高 50 分 = 100% 置信度
      };
    }
  }
  
  return { agentId: bestMatch.agentId, confidence: bestMatch.confidence };
}

/**
 * 从 workspace 目录名识别 Agent
 * 
 * 用于 init-db.js 等脚本直接识别
 */
export function identifyAgentByWorkspace(dirName: string): { id: string; name: string; channel: string } | null {
  const map: Record<string, { id: string; name: string; channel: string }> = {
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
export function getAgentInfo(agentId: string): AgentIdentityRule | undefined {
  return AGENT_IDENTITY_RULES.find(r => r.id === agentId);
}
