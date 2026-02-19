/**
 * Agent 智能路由组件
 * 
 * 用途：根据用户输入的关键词，推荐最适合的 Agent
 * 
 * 设计特点：
 * - 实时分析输入内容
 * - 可视化推荐结果
 * - 一键跳转到对应渠道
 */

'use client';

import { useState, useMemo } from 'react';

/**
 * Agent 路由规则配置
 * 
 * 为什么用关键词匹配而不是 NLP：
 * - Phase 1.5 保持简单，关键词足够准确
 * - 响应速度快，无需外部 API
 * - 后续可以无缝升级为意图分类模型
 */
const ROUTING_RULES = [
  {
    agentId: 'craft',
    name: 'Craft',
    role: '代码助手',
    channel: 'Discord',
    keywords: ['代码', '开发', 'bug', '修复', '编程', 'api', '数据库', '前端', '后端', 'react', 'next', 'typescript', 'git', '部署', 'claude'],
    color: 'blue'
  },
  {
    agentId: 'alpha',
    name: 'Alpha',
    role: '投资助手',
    channel: 'Discord',
    keywords: ['股票', '投资', '持仓', '财报', '分析', '市场', '特斯拉', 'tsla', '理财', '基金', '加密货币', '比特币'],
    color: 'green'
  },
  {
    agentId: 'main',
    name: 'Main',
    role: '主助手',
    channel: '飞书',
    keywords: ['任务', '日程', '安排', '提醒', '待办', '会议', '飞书', '配置', '设置', '日常'],
    color: 'purple'
  },
  {
    agentId: 'helix',
    name: 'Helix',
    role: 'Discord助手',
    channel: 'Discord',
    keywords: ['discord', '频道', '消息', '通知'],
    color: 'gray'
  }
];

/**
 * 计算输入文本与各 Agent 的匹配分数
 * 
 * 算法：
 * - 每匹配一个关键词 +10 分
 * - 关键词出现在开头额外 +5 分
 * - 返回分数最高的 Agent
 */
function calculateMatchScore(input: string, keywords: string[]): number {
  const lowerInput = input.toLowerCase();
  let score = 0;
  
  keywords.forEach(keyword => {
    if (lowerInput.includes(keyword.toLowerCase())) {
      score += 10;
      // 关键词出现在开头加分
      if (lowerInput.startsWith(keyword.toLowerCase())) {
        score += 5;
      }
    }
  });
  
  return score;
}

export function AgentRouter() {
  const [input, setInput] = useState('');
  
  // 计算推荐结果
  const recommendations = useMemo(() => {
    if (!input.trim()) return [];
    
    return ROUTING_RULES
      .map(rule => ({
        ...rule,
        score: calculateMatchScore(input, rule.keywords)
      }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);  // 只显示前 2 个推荐
  }, [input]);
  
  /**
   * 获取颜色样式
   */
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      blue: { bg: 'bg-blue-900/20', border: 'border-blue-700', text: 'text-blue-400' },
      green: { bg: 'bg-green-900/20', border: 'border-green-700', text: 'text-green-400' },
      purple: { bg: 'bg-purple-900/20', border: 'border-purple-700', text: 'text-purple-400' },
      gray: { bg: 'bg-gray-800', border: 'border-gray-600', text: 'text-gray-400' }
    };
    return colors[color] || colors.gray;
  };

  const handleRecommendationClick = (selectedAgentId: string) => {
    if (!input.trim() || recommendations.length === 0) {
      return;
    }

    const topRecommendation = recommendations[0];
    const payload = {
      inputText: input.trim(),
      recommendedAgentId: topRecommendation.agentId,
      recommendedScore: topRecommendation.score,
      userSelectedAgentId: selectedAgentId,
      wasAccepted: selectedAgentId === topRecommendation.agentId,
    };

    // 用户即将跳转到外部协议，使用 keepalive 尽量确保日志请求发送成功
    fetch('/api/routing-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // 采集失败不影响主流程
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">🎯 Agent 智能路由</h3>
      
      {/* 输入框 */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="描述你想做什么，例如：修复代码bug、分析股票..."
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
        {input && (
          <button
            onClick={() => setInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* 推荐结果 */}
      {recommendations.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-400 mb-2">推荐 Agent：</p>
          
          {recommendations.map((rec, index) => {
            const colors = getColorClasses(rec.color);
            const isTopMatch = index === 0;
            
            return (
              <div
                key={rec.agentId}
                className={`flex items-center justify-between p-3 rounded-lg border ${colors.bg} ${colors.border} ${isTopMatch ? 'ring-1 ring-blue-500/50' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${colors.bg.replace('/20', '')} ${colors.text}`}>
                    {rec.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{rec.name}</span>
                      <span className={`text-xs ${colors.text}`}>{rec.role}</span>
                      {isTopMatch && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                          最佳匹配
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      渠道: {rec.channel} · 匹配度: {rec.score}分
                    </div>
                  </div>
                </div>
                
                <a
                  href={rec.channel === 'Discord' ? 'discord://' : 'feishu://'}
                  onClick={() => handleRecommendationClick(rec.agentId)}
                  className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                >
                  打开 {rec.channel}
                </a>
              </div>
            );
          })}
        </div>
      )}
      
      {/* 提示信息 */}
      {input && recommendations.length === 0 && (
        <div className="mt-4 p-3 bg-gray-900/50 rounded text-sm text-gray-500">
          💡 未识别到明确的 Agent 偏好，可以尝试输入：代码、投资、任务等关键词
        </div>
      )}
    </div>
  );
}
