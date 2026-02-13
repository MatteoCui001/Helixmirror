/**
 * 最近活动列表组件
 * 
 * 用途：展示最近的 Agent 交互记录
 * 
 * 设计特点：
 * - 时间线样式，按时间倒序排列
 * - 每条记录显示 Agent、渠道、内容预览
 * - 滚动区域处理长列表
 */

import { RecentActivity } from '@/lib/queries';

interface ActivityListProps {
  activities: RecentActivity[];
}

/**
 * 格式化相对时间
 * 
 * 示例：
 * - 2 分钟前
 * - 1 小时前
 * - 昨天 14:30
 * - 2024/01/15
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays === 1) return `昨天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (diffDays < 7) return `${diffDays} 天前`;
  
  return date.toLocaleDateString('zh-CN');
}

/**
 * 截断文本到指定长度
 */
function truncate(text: string, maxLength: number = 50): string {
  if (!text) return '无内容';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-500">暂无活动记录</p>
        <p className="text-gray-600 text-sm mt-2">
          开始使用 Agent 后，这里会显示交互历史
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`p-4 ${index !== activities.length - 1 ? 'border-b border-gray-700' : ''}`}
          >
            {/* 头部：Agent 名称和时间 */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white text-sm">
                  {activity.agentName}
                </span>
                <span className="text-xs text-gray-500">
                  {activity.agentRole}
                </span>
              </div>
              <time className="text-xs text-gray-500" dateTime={activity.createdAt}>
                {formatRelativeTime(activity.createdAt)}
              </time>
            </div>

            {/* 渠道标签 */}
            <div className="mb-1">
              <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-400">
                {activity.channel}
              </span>
            </div>

            {/* 内容预览 */}
            <p className="text-sm text-gray-400 truncate">
              {truncate(activity.messagePreview)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
