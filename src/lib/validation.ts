/**
 * 数据验证 Schema - Helix Mirror
 * 
 * 用途：
 * - 使用 Zod 定义数据结构和验证规则
 * - 统一 API 输入验证
 * - 类型安全（从 Schema 推断 TypeScript 类型）
 * 
 * 为什么用 Zod：
 * - 运行时验证 + 编译时类型
 * - 清晰的错误信息
 * - 易于组合和复用
 */

import { z } from 'zod';

// ===========================================
// Agent 相关 Schema
// ===========================================

/**
 * Agent ID 验证
 * 
 * 限制：必须是预定义的 4 个 Agent 之一
 */
export const AgentIdSchema = z.enum(['main', 'craft', 'alpha', 'helix'], {
  errorMap: () => ({ message: 'Agent ID 必须是 main、craft、alpha 或 helix' }),
});

/**
 * 渠道验证
 */
export const ChannelSchema = z.enum(['飞书', 'Discord'], {
  errorMap: () => ({ message: '渠道必须是 飞书 或 Discord' }),
});

// ===========================================
// API 请求 Schema
// ===========================================

/**
 * 添加交互记录请求
 * 
 * POST /api/interactions
 */
export const AddInteractionSchema = z.object({
  agentId: AgentIdSchema,
  channel: ChannelSchema,
  messagePreview: z.string()
    .min(1, '消息预览不能为空')
    .max(500, '消息预览不能超过 500 字符'),
  messageCount: z.number()
    .int('消息数必须是整数')
    .min(1, '消息数至少为 1')
    .default(1),
});

/**
 * 查询交互记录请求
 * 
 * GET /api/interactions?limit=10
 */
export const QueryInteractionsSchema = z.object({
  limit: z.string()
    .optional()
    .transform((val) => {
      if (!val) return 10;
      const num = parseInt(val, 10);
      if (isNaN(num)) return 10;
      return Math.min(Math.max(num, 1), 100); // 限制 1-100
    }),
});

// ===========================================
// 项目相关 Schema
// ===========================================

/**
 * 项目状态
 */
export const ProjectStatusSchema = z.enum(['active', 'paused', 'completed']);

/**
 * 创建项目请求
 * 
 * POST /api/projects
 */
export const CreateProjectSchema = z.object({
  name: z.string()
    .min(1, '项目名称不能为空')
    .max(100, '项目名称不能超过 100 字符'),
  description: z.string()
    .max(500, '项目描述不能超过 500 字符')
    .optional(),
  agentIds: z.array(AgentIdSchema)
    .min(1, '至少选择一个 Agent')
    .optional(),
});

/**
 * 更新项目状态请求
 * 
 * PATCH /api/projects/:id
 */
export const UpdateProjectStatusSchema = z.object({
  status: ProjectStatusSchema,
});

// ===========================================
// 类型导出（从 Schema 推断）
// ===========================================

export type AddInteractionInput = z.infer<typeof AddInteractionSchema>;
export type QueryInteractionsInput = z.infer<typeof QueryInteractionsSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectStatusInput = z.infer<typeof UpdateProjectStatusSchema>;
