/**
 * API Route: /api/interactions
 * 
 * 用途：通过 HTTP 请求获取和添加交互记录
 * 使用 SQLite
 * 
 * 安全更新：
 * - 添加 Token 认证（生产环境必需）
 * - 开发环境可跳过（方便调试）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { validateToken, unauthorizedResponse, isDevelopment } from '@/lib/auth';

/**
 * POST - 添加交互记录
 * 
 * 注意：修改操作需要认证（生产环境）
 */
export async function POST(request: NextRequest) {
  try {
    // 认证检查（生产环境必需）
    if (!isDevelopment() && !validateToken(request)) {
      return unauthorizedResponse();
    }
    
    const body = await request.json();
    const { agentId, channel, messagePreview, messageCount = 1 } = body;

    // 参数验证
    if (!agentId || !channel || !messagePreview) {
      return NextResponse.json(
        { error: '缺少必需参数: agentId, channel, messagePreview' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    
    // 验证 agent 是否存在
    const agent = db.prepare('SELECT id FROM agents WHERE id = ?').get(agentId);
    
    if (!agent) {
      return NextResponse.json(
        { error: `Agent "${agentId}" 不存在`, availableAgents: ['main', 'craft', 'alpha', 'helix'] },
        { status: 404 }
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
      messageCount
    }, { status: 201 });

  } catch (error) {
    console.error('添加交互记录失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET - 获取最近交互记录
 * 
 * 注意：读取操作开放（方便展示），如需保护可添加认证
 */
export async function GET(request: NextRequest) {
  try {
    // GET 操作默认开放，如需保护可取消下面注释
    // if (!isDevelopment() && !validateToken(request)) {
    //   return unauthorizedResponse();
    // }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
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

    return NextResponse.json({ records, count: records.length });

  } catch (error) {
    console.error('查询交互记录失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: (error as Error).message },
      { status: 500 }
    );
  }
}
