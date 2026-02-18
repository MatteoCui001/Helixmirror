/**
 * 加载骨架屏组件 - Helix Mirror
 * 
 * 用途：
 * - 数据加载时显示占位 UI
 * - 提升感知性能
 * - 避免布局跳动
 */

/**
 * 统计卡片骨架屏
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-700 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-700 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Agent 卡片骨架屏
 */
export function AgentCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="h-6 bg-gray-700 rounded w-24 mb-1"></div>
          <div className="h-4 bg-gray-700 rounded w-16"></div>
        </div>
        <div className="text-right">
          <div className="h-8 bg-gray-700 rounded w-12 mb-1"></div>
          <div className="h-3 bg-gray-700 rounded w-8"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-700/50 rounded p-2">
          <div className="h-3 bg-gray-700 rounded w-12 mb-1"></div>
          <div className="h-5 bg-gray-700 rounded w-8"></div>
        </div>
        <div className="bg-gray-700/50 rounded p-2">
          <div className="h-3 bg-gray-700 rounded w-12 mb-1"></div>
          <div className="h-5 bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * 活动列表骨架屏
 */
export function ActivityListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start space-x-3 animate-pulse">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 图表骨架屏
 */
export function ChartSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-32 mb-6"></div>
      <div className="h-64 bg-gray-700/50 rounded"></div>
    </div>
  );
}

/**
 * 页面整体加载状态
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      {/* 标题 */}
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-800 rounded w-64"></div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      
      {/* 图表 */}
      <div className="mb-8">
        <ChartSkeleton />
      </div>
      
      {/* Agent 卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AgentCardSkeleton />
        <AgentCardSkeleton />
        <AgentCardSkeleton />
        <AgentCardSkeleton />
      </div>
    </div>
  );
}
