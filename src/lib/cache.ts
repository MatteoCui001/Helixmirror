/**
 * 数据缓存层 - Helix Mirror
 * 
 * 用途：
 * - 使用 React cache() 实现请求级缓存
 * - 减少重复数据库查询
 * - 提升仪表盘加载速度
 * 
 * 为什么需要缓存：
 * - Next.js Server Components 每次请求都执行
 * - 仪表盘多个组件需要相同数据
 * - 缓存可以显著减少数据库查询次数
 */

import { cache } from 'react';
import { getAgentStats, getTodayOverview, getRecentActivities } from './queries';
import { getProjectStats, getAllProjects } from './projects';
import { getRecentRoutingLogs, getRoutingMetrics } from './routing-logs';

/**
 * 缓存的 Agent 统计
 * 
 * 用途：Dashboard、AgentActivityChart 等多个组件使用
 * 缓存时间：单次请求生命周期
 */
export const getCachedAgentStats = cache(getAgentStats);

/**
 * 缓存的今日概览
 * 
 * 用途：Dashboard 顶部的三个统计卡片
 */
export const getCachedTodayOverview = cache(getTodayOverview);

/**
 * 缓存的最近活动
 * 
 * @param limit 返回条数，默认 10
 */
export const getCachedRecentActivities = cache((limit: number = 10) => {
  return getRecentActivities(limit);
});

/**
 * 缓存的项目统计
 * 
 * 用途：顶部导航栏的项目计数
 */
export const getCachedProjectStats = cache(getProjectStats);

/**
 * 缓存的项目列表
 * 
 * 用途：项目页面
 */
export const getCachedAllProjects = cache(getAllProjects);

/**
 * 缓存的路由日志
 */
export const getCachedRecentRoutingLogs = cache((limit: number = 10) => {
  return getRecentRoutingLogs(limit);
});

/**
 * 缓存的路由指标
 */
export const getCachedRoutingMetrics = cache(getRoutingMetrics);

/**
 * 清空所有缓存（调试用）
 * 
 * 注意：React cache 在请求结束时自动清理
 * 此函数仅用于特殊场景
 */
export function clearAllCache(): void {
  // React cache 是请求级的，不需要手动清理
  // 此函数作为占位，以备将来需要
  console.log('[Cache] 缓存是请求级的，已自动管理');
}
