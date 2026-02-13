"use client";

/**
 * Agent 活动图表组件
 * 
 * 用途：用柱状图可视化展示各 Agent 的今日 vs 总交互量
 * 
 * 为什么是 Client Component：
 * - Recharts 需要浏览器环境（依赖 SVG 和 DOM）
 * - Next.js 的 Server Components 不能直接用交互式图表库
 */

import { AgentStat } from '@/lib/queries';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AgentActivityChartProps {
  agentStats: AgentStat[];
}

/**
 * 图表数据格式化
 * 
 * 为什么需要转换：
 * - Recharts 需要特定格式的数据数组
 * - 我们把后端返回的数据转换成图表需要的格式
 */
function formatChartData(stats: AgentStat[]) {
  return stats.map((agent) => ({
    name: agent.name,
    今日: agent.todayInteractions,
    总计: agent.totalInteractions,
  }));
}

/**
 * 自定义提示框
 * 
 * 用途：鼠标悬停在柱子上时显示详细信息
 * - 比默认提示框更美观
 * - 显示中文标签
 */
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value} 次
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function AgentActivityChart({ agentStats }: AgentActivityChartProps) {
  const data = formatChartData(agentStats);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">📈 Agent 活跃度对比</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#9ca3af' }}
            />
            <Bar 
              dataKey="今日" 
              fill="#6366f1"  // 靛紫色
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="总计" 
              fill="#4b5563"  // 灰色
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
