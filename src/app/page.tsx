/**
 * 主仪表盘页面
 * 
 * 用途：Helix Mirror 的核心界面，展示所有 Agent 的交互统计
 * 
 * 更新记录：
 * - Phase 1.5: 添加 Agent 路由组件和项目导航
 * - Phase 3: 支持云端 PostgreSQL 模式
 * - Phase 3.1: 自动数据库初始化
 * - Phase 3.2: 使用动态渲染避免构建时数据库连接
 */

import { getAgentStats, getTodayOverview, getRecentActivities } from '@/lib/queries';
import { getProjectStats } from '@/lib/projects';
import { initializeDatabase } from '@/lib/db-init';
import { AgentCard } from '@/components/AgentCard';
import { StatCard } from '@/components/StatCard';
import { ActivityList } from '@/components/ActivityList';
import { AgentActivityChart } from '@/components/AgentActivityChart';
import { AgentRouter } from '@/components/AgentRouter';
import Link from 'next/link';

// 禁用静态生成，强制动态渲染
// 这样构建时不会查询数据库，只在运行时查询
export const dynamic = 'force-dynamic';

/**
 * 主页面组件（异步）
 * 
 * 支持双模式：SQLite（本地）和 PostgreSQL（云端）
 * 所有数据获取改为 async/await
 * 自动初始化数据库（如果未初始化）
 */
export default async function DashboardPage() {
  // 自动初始化数据库（仅 PostgreSQL 模式）
  if (process.env.USE_POSTGRES === 'true') {
    try {
      await initializeDatabase();
    } catch (error) {
      console.error('数据库初始化失败:', error);
    }
  }
  
  // 服务端获取数据（异步）
  const [agentStats, todayOverview, recentActivities, projectStats] = await Promise.all([
    getAgentStats(),
    getTodayOverview(),
    getRecentActivities(10),
    getProjectStats()
  ]);
  
  return (
    <div className="min-h-screen bg-gray-900">
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
              {/* 项目链接 */}
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
        {/* Agent 智能路由 */}
        <section className="mb-8">
          <AgentRouter />
        </section>

        {/* 今日概览 */}
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

        {/* Agent 活动趋势图 */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">📈 活动趋势</h2>
          <div className="bg-gray-800 rounded-lg p-6">
            <AgentActivityChart agentStats={agentStats} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agent 卡片列表 */}
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

          {/* 最近活动 */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">📝 最近活动</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              <ActivityList activities={recentActivities} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
