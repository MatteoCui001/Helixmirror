/**
 * API Route: /api/interactions
 * 
 * 用途：通过 HTTP 请求获取和添加交互记录
 * 使用 SQLite
 * 
 * 更新：
 * - 添加 Zod 输入验证
 * - 统一错误响应格式
 * - Token 认证（生产环境）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { validateToken, unauthorizedResponse, isDevelopment } from '@/lib/auth';
import { checkRateLimit, getClientIp, RATE_LIMIT_MAX } from '@/lib/rate-limit';
import {
  AddInteractionSchema,
  QueryInteractionsSchema
} from '@/lib/validation';

/**
 * 统一错误响应格式
 */
function errorResponse(message: string, details?: string, status: number = 400) {
  return NextResponse.json(
    { error: message, details },
    { status }
  );
}

/**
 * POST - 添加交互记录
 */
export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    // 认证检查（生产环境必需）
    if (!isDevelopment() && !validateToken(request)) {
      return unauthorizedResponse();
    }
    
    // 解析请求体
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('请求体必须是有效的 JSON', undefined, 400);
    }
    
    // Zod 验证
    const validationResult = AddInteractionSchema.safeParse(body);
    
    if (!validationResult.success) {
      // 格式化 Zod 错误信息
      const errors = validationResult.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      
      return NextResponse.json(
        { 
          error: '参数验证失败', 
          details: errors 
        },
        { status: 400 }
      );
    }
    
    // 验证通过，使用解析后的数据
    const { agentId, channel, messagePreview, messageCount } = validationResult.data;
    
    const db = getDatabase();
    
    // 验证 agent 是否存在（额外的业务验证）
    const agent = db.prepare('SELECT id FROM agents WHERE id = ?').get(agentId);
    
    if (!agent) {
      return errorResponse(
        `Agent "${agentId}" 不存在`,
        '可用的 Agents: main, craft, alpha, helix',
        404
      );
    }

    // 插入记录
    const insert = db.prepare(`
      INSERT INTO interactions (agent_id, channel, message_preview, message_count)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = insert.run(agentId, channel, messagePreview, messageCount);

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      agentId,
      channel,
      messagePreview,
      messageCount,
    }, {
      status: 201,
      headers: {
        'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
      },
    });

  } catch (error) {
    console.error('[API] 添加交互记录失败:', error);
    return errorResponse(
      '服务器内部错误',
      process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      500
    );
  }
}

/**
 * GET - 获取最近交互记录
 */
export async function GET(request: NextRequest) {
  try {
    // 速率限制检查
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    // 认证检查（生产环境必需）
    if (!isDevelopment() && !validateToken(request)) {
      return unauthorizedResponse();
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    
    // Zod 验证查询参数
    const validationResult = QueryInteractionsSchema.safeParse({
      limit: searchParams.get('limit') || undefined,
    });
    
    const limit = validationResult.success 
      ? validationResult.data.limit 
      : 10;
    
    const db = getDatabase();
    
    const query = db.prepare(`
      SELECT 
        i.id,
        a.name as agentName,
        a.role as agentRole,
        i.channel,
        i.message_preview as messagePreview,
        i.message_count as messageCount,
        i.created_at as createdAt
      FROM interactions i
      JOIN agents a ON i.agent_id = a.id
      ORDER BY i.created_at DESC
      LIMIT ?
    `);
    
    const records = query.all(limit);

    return NextResponse.json({
      success: true,
      records,
      count: records.length,
      limit,
    }, {
      headers: {
        'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
      },
    });

  } catch (error) {
    console.error('[API] 查询交互记录失败:', error);
    return errorResponse(
      '服务器内部错误',
      process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      500
    );
  }
}
