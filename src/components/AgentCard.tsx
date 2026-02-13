/**
 * Agent 卡片组件
 * 
 * 用途：展示单个 Agent 的核心统计数据
 * 
 * 设计思路：
 * - 卡片式布局，信息密度适中
 * - 用颜色区分不同角色
 * - 突出今日数据和趋势
 */

import { AgentStat } from '@/lib/queries';

interface AgentCardProps {
  agent: AgentStat;
}

/**
 * 根据 Agent 角色返回对应的颜色主题
 * 
 * 为什么这样做：
 * - 视觉区分不同 Agent，快速识别
 * - 一致的颜色系统，提升品牌感
 */
function getAgentColors(role: string): { bg: string; border: string; text: string } {
  switch (role) {
    case '代码助手':
      return {
        bg: 'bg-blue-900/30',
        border: 'border-blue-700',
        text: 'text-blue-400'
      };
    case '投资助手':
      return {
        bg: 'bg-green-900/30',
        border: 'border-green-700',
        text: 'text-green-400'
      };
    case '主助手':
      return {
        bg: 'bg-purple-900/30',
        border: 'border-purple-700',
        text: 'text-purple-400'
      };
    default:
      return {
        bg: 'bg-gray-800',
        border: 'border-gray-700',
        text: 'text-gray-400'
      };
  }
}

export function AgentCard({ agent }: AgentCardProps) {
  const colors = getAgentColors(agent.role);
  
  // 格式化最后活跃时间
  const lastActiveText = agent.lastActive
    ? new Date(agent.lastActive).toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '从未';

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-5 transition-all hover:scale-[1.02]`}>
      {/* 头部：名称和角色 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{agent.name}</h3>
          <span className={`text-xs ${colors.text} font-medium`}>
            {agent.role}
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {agent.todayInteractions}
          </div>
          <div className="text-xs text-gray-500">今日</div>
        </div>
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-gray-400 text-xs mb-1">总交互</div>
          <div className="text-white font-semibold">{agent.totalInteractions}</div>
        </div>
        <div className="bg-gray-800/50 rounded p-2">
          <div className="text-gray-400 text-xs mb-1">最后活跃</div>
          <div className="text-white font-semibold truncate" title={lastActiveText}>
            {lastActiveText}
          </div>
        </div>
      </div>
    </div>
  );
}
