/**
 * 主仪表盘页面 - 带 Loading 状态
 * 
 * 用途：Helix Mirror 的核心界面，展示所有 Agent 的交互统计
 * 
 * 改进：
 * - 添加 Suspense 和 loading 状态
 * - 使用骨架屏提升感知性能
 * - 组件级错误边界
 */

import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/Skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardContent } from './DashboardContent';

/**
 * 主页面组件
 * 
 * 使用 Suspense 实现渐进式加载：
 * - 数据获取期间显示骨架屏
 * - 避免白屏等待
 * - 提升用户体验
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* 全局错误边界 */}
      <ErrorBoundary>
        {/* Suspense 包裹数据依赖的组件 */}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
