/**
 * 项目管理页面
 * 
 * 用途：展示和管理跨 Agent 共享的项目上下文
 * 使用 SQLite（本地开发 + Vercel 部署）
 */

import { getAllProjects, getProjectStats } from '@/lib/projects';
import { ProjectCard } from '@/components/ProjectCard';
import Link from 'next/link';

/**
 * 项目列表页面
 */
export default function ProjectsPage() {
  // 服务端获取数据
  const projects = getAllProjects();
  const stats = getProjectStats();

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← 返回仪表盘
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">📁 项目记忆层</h1>
                <p className="mt-1 text-sm text-gray-400">
                  跨 Agent 共享的项目上下文
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-gray-500">总项目</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.active}</div>
                <div className="text-gray-500">进行中</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h2 className="text-xl font-semibold text-white mb-2">暂无项目</h2>
            <p className="text-gray-400 mb-6">
              项目用于跨 Agent 共享上下文信息。
              <br />
              例如：Helix Mirror 开发、投资组合管理、日常任务等。
            </p>
            <div className="bg-gray-700 rounded p-4 text-left text-sm text-gray-300 max-w-md mx-auto">
              <p className="font-medium mb-2">💡 提示：使用 API 添加项目</p>
              <code className="block bg-gray-900 rounded p-2 text-xs">
                POST /api/projects
                <br />
                {'{'}&quot;name&quot;: &quot;新项目&quot;, &quot;description&quot;: &quot;...&quot;, &quot;agentIds&quot;: [&quot;craft&quot;]{'}'}
              </code>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
