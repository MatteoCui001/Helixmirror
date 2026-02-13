/**
 * 项目卡片组件
 * 
 * 用途：在项目中列表展示单个项目信息
 * 
 * 设计特点：
 * - 清晰展示项目状态和关联 Agent
 * - 支持状态切换操作
 */

'use client';

import { Project } from '@/lib/projects';

interface ProjectCardProps {
  project: Project;
  onStatusChange?: (id: number, status: 'active' | 'paused' | 'completed') => void;
}

/**
 * 根据状态返回对应的样式
 */
function getStatusStyles(status: Project['status']): {
  badge: string;
  dot: string;
  text: string;
} {
  switch (status) {
    case 'active':
      return {
        badge: 'bg-green-900/30 border-green-700 text-green-400',
        dot: 'bg-green-500',
        text: '进行中'
      };
    case 'paused':
      return {
        badge: 'bg-yellow-900/30 border-yellow-700 text-yellow-400',
        dot: 'bg-yellow-500',
        text: '已暂停'
      };
    case 'completed':
      return {
        badge: 'bg-gray-700/50 border-gray-600 text-gray-400',
        dot: 'bg-gray-500',
        text: '已完成'
      };
  }
}

/**
 * Agent ID 映射到显示名称
 */
const AGENT_NAME_MAP: Record<string, string> = {
  main: 'Main',
  craft: 'Craft',
  alpha: 'Alpha',
  helix: 'Helix'
};

export function ProjectCard({ project, onStatusChange }: ProjectCardProps) {
  const styles = getStatusStyles(project.status);
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 hover:border-gray-600 transition-colors">
      {/* 头部：项目名称和状态 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{project.name}</h3>
          <div className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded border text-xs mt-1 ${styles.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
            <span>{styles.text}</span>
          </div>
        </div>
        
        {/* 状态切换按钮 */}
        {onStatusChange && (
          <select
            value={project.status}
            onChange={(e) => onStatusChange(project.id, e.target.value as Project['status'])}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="active">设为进行中</option>
            <option value="paused">设为暂停</option>
            <option value="completed">设为完成</option>
          </select>
        )}
      </div>
      
      {/* 项目描述 */}
      {project.description && (
        <p className="text-gray-400 text-sm mb-4">{project.description}</p>
      )}
      
      {/* 关联 Agent */}
      {project.agentIds.length > 0 && (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">参与 Agent：</span>
          <div className="flex space-x-1">
            {project.agentIds.map((agentId) => (
              <span
                key={agentId}
                className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300"
              >
                {AGENT_NAME_MAP[agentId] || agentId}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* 时间信息 */}
      <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500">
        更新于 {new Date(project.updatedAt).toLocaleString('zh-CN')}
      </div>
    </div>
  );
}
