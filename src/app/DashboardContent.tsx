/**
 * 仪表盘内容组件
 * 
 * 用途：分离数据获取逻辑，配合 Suspense 使用
 * 
 * 为什么分离：
 * - Suspense 需要包装异步组件
 * - 页面级组件保持简洁
 * - 便于测试和维护
 */

import {
  getCachedAgentStats,
  getCachedTodayOverview,
  getCachedRecentActivities,
  getCachedProjectStats,
} from '@/lib/cache';
import { AgentCard } from '@/components/AgentCard';
import { StatCard } from '@/components/StatCard';
import { ActivityList } from '@/components/ActivityList';
import { AgentActivityChart } from '@/components/AgentActivityChart';
import { AgentRouter } from '@/components/AgentRouter';
import Link from 'next/link';

/**
 * DashboardContent 组件
 * 
 * 注意：此组件在 Suspense 内使用
 * 数据获取会触发 Suspense fallback
 */
export async function DashboardContent() {
  // 并行获取所有数据，提升性能
  const [
    agentStats,
    todayOverview,
    recentActivities,
    projectStats
  ] = await Promise.all([
    Promise.resolve(getCachedAgentStats()),
    Promise.resolve(getCachedTodayOverview()),
    Promise.resolve(getCachedRecentActivities(10)),
    Promise.resolve(getCachedProjectStats()),
  ]);
  
  return (
    <>
      {/* 顶部标题栏 */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                🧬 Helix Mirror
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Agent 交互仪表盘 - 观察、理解、优化你的 AI 助手网络
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/projects"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
              >
                <span>📁</span>
                <span>项目 ({projectStats.active}/{projectStats.total})</span>
              </Link>
              
              <div className="text-sm text-gray-400">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8">
          <AgentRouter />
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">📊 今日概览</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="总消息数"
              value={todayOverview.totalMessages}
              icon="💬"
              color="blue"
            />
            <StatCard
              title="活跃 Agent"
              value={todayOverview.activeAgents}
              icon="🤖"
              color="green"
            />
            <StatCard
              title="对话次数"
              value={todayOverview.totalInteractions}
              icon="🗣️"
              color="purple"
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">📈 活动趋势</h2>
          <div className="bg-gray-800 rounded-lg p-6">
            <AgentActivityChart agentStats={agentStats} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4">🤖 Agent 状态</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agentStats.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-4">📝 最近活动</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              <ActivityList activities={recentActivities} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
