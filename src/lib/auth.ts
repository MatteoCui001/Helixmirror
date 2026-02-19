/**
 * API 认证中间件
 * 
 * 用途：
 * - 验证 API 请求的身份
 * - 防止未授权访问
 * - 简单的 Token 认证
 * 
 * 为什么需要认证：
 * - 当前 API 端点完全开放
 * - 任何人都可以添加/删除数据
 * - 保护数据安全
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * 验证 API Token
 * 
 * 检查请求头中的 Authorization: Bearer <token>
 * 
 * @param request Next.js 请求对象
 * @returns 验证成功返回 true，失败返回 false
 */
export function validateToken(request: NextRequest): boolean {
  const apiToken = process.env.API_TOKEN?.trim();
  if (!apiToken) {
    return false;
  }

  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return false;
  }
  
  // 支持 Bearer Token 格式
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return false;
  }
  
  return parts[1] === apiToken;
}

/**
 * 认证错误响应
 * 
 * 返回统一的 401 错误格式
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message: '缺少或无效的认证令牌',
      hint: '请在请求头中添加: Authorization: Bearer YOUR_TOKEN',
    },
    { status: 401 }
  );
}

/**
 * 检查是否为开发环境
 * 
 * 开发环境可以跳过认证（方便调试）
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
