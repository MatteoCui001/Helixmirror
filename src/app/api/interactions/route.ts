/**
 * API Route: /api/interactions
 * 
 * 用途：通过 HTTP 请求获取和添加交互记录
 * 支持双模式：SQLite（本地）和 PostgreSQL（云端）
 * 
 * 调用示例：
 *   GET: curl http://localhost:3000/api/interactions?limit=10
 *   POST: curl -X POST http://localhost:3000/api/interactions \
 *     -H "Content-Type: application/json" \
 *     -d '{"agentId":"craft","channel":"Discord","messagePreview":"开发新功能"}'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getPrisma } from '@/lib/db';

const USE_POSTGRES = process.env.USE_POSTGRES === 'true';

/**
 * POST - 添加交互记录
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, channel, messagePreview, messageCount = 1 } = body;

    // 参数验证
    if (!agentId || !channel || !messagePreview) {
      return NextResponse.json(
        { error: '缺少必需参数: agentId, channel, messagePreview' },
        { status: 400 }
      );
    }

    if (USE_POSTGRES) {
      return await addInteractionPostgres(agentId, channel, messagePreview, messageCount);
    } else {
      return addInteractionSQLite(agentId, channel, messagePreview, messageCount);
    }

  } catch (error) {
    console.error('添加交互记录失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * SQLite 模式：添加交互记录
 */
function addInteractionSQLite(
  agentId: string,
  channel: string,
  messagePreview: string,
  messageCount: number
) {
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
}

/**
 * PostgreSQL 模式：添加交互记录
 */
async function addInteractionPostgres(
  agentId: string,
  channel: string,
  messagePreview: string,
  messageCount: number
) {
  const prisma = getPrisma();
  
  // 验证 agent 是否存在
  const agent = await prisma.agent.findUnique({
    where: { agentId }
  });
  
  if (!agent) {
    return NextResponse.json(
      { error: `Agent "${agentId}" 不存在`, availableAgents: ['main', 'craft', 'alpha', 'helix'] },
      { status: 404 }
    );
  }

  // 插入记录
  const interaction = await prisma.interaction.create({
    data: {
      agentId,
      channel,
      messagePreview,
      messageCount
    }
  });

  return NextResponse.json({
    success: true,
    id: interaction.id,
    agentId,
    channel,
    messagePreview,
    messageCount
  }, { status: 201 });
}

/**
 * GET - 获取最近交互记录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (USE_POSTGRES) {
      return await getInteractionsPostgres(limit);
    } else {
      return getInteractionsSQLite(limit);
    }

  } catch (error) {
    console.error('查询交互记录失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * SQLite 模式：获取交互记录
 */
function getInteractionsSQLite(limit: number) {
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
}

/**
 * PostgreSQL 模式：获取交互记录
 */
async function getInteractionsPostgres(limit: number) {
  const prisma = getPrisma();
  
  const interactions = await prisma.interaction.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { agent: true }
  });
  
  const records = interactions.map(i => ({
    id: i.id,
    agentName: i.agent.name,
    agentRole: i.agent.role,
    channel: i.channel,
    messagePreview: i.messagePreview,
    messageCount: i.messageCount,
    createdAt: i.createdAt.toISOString()
  }));

  return NextResponse.json({ records, count: records.length });
}
