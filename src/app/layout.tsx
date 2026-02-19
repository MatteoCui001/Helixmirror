/**
 * 根布局组件
 * 
 * 用途：定义整个应用的 HTML 结构和全局样式
 * 
 * 设计决策：
 * - 使用深色主题（更适合长时间查看的仪表盘）
 * - 加载 Inter 字体（现代、易读）
 * - 初始化数据库（只在服务端执行一次）
 * - 全局错误边界（防止白屏）
 */

import type { Metadata } from 'next';
import './globals.css';
import { initDatabase } from '@/lib/db';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// 页面元信息 - 用于 SEO 和浏览器标签
export const metadata: Metadata = {
  title: 'Helix Mirror - Agent 仪表盘',
  description: '统一的多 Agent 管理与协同系统',
};

/**
 * 初始化数据库
 * 
 * 注意：这段代码只在服务端执行
 * - Next.js 的 Server Components 在服务端渲染
 * - 客户端不会执行这里
 */
if (typeof window === 'undefined') {
  initDatabase();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-900 text-white min-h-screen">
        {/* 全局错误边界 - 捕获所有子组件的错误 */}
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
