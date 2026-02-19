import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMIT_MAX } from '@/lib/rate-limit';
import { validateToken, unauthorizedResponse, isDevelopment } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { CreateRoutingLogSchema, QueryRoutingLogsSchema } from '@/lib/validation';

function errorResponse(message: string, details?: unknown, status: number = 400) {
  return NextResponse.json({ error: message, details }, { status });
}

function rateLimitHeaders(rateLimit: { remaining: number; resetTime: number }) {
  return {
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
  };
}

function checkAuthAndRateLimit(request: NextRequest) {
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

  if (!isDevelopment() && !validateToken(request)) {
    return unauthorizedResponse();
  }

  return { rateLimit };
}

export async function POST(request: NextRequest) {
  try {
    const checkResult = checkAuthAndRateLimit(request);
    if (checkResult instanceof NextResponse) {
      return checkResult;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('请求体必须是有效的 JSON', undefined, 400);
    }

    const validationResult = CreateRoutingLogSchema.safeParse(body);
    if (!validationResult.success) {
      const details = validationResult.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return errorResponse('参数验证失败', details, 400);
    }

    const {
      inputText,
      recommendedAgentId,
      recommendedScore,
      userSelectedAgentId,
      wasAccepted,
    } = validationResult.data;

    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO routing_logs (
        input_text,
        recommended_agent_id,
        recommended_score,
        user_selected_agent_id,
        was_accepted
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      inputText,
      recommendedAgentId,
      recommendedScore,
      userSelectedAgentId ?? null,
      wasAccepted ? 1 : 0
    );

    return NextResponse.json(
      { success: true, id: result.lastInsertRowid },
      {
        status: 201,
        headers: rateLimitHeaders(checkResult.rateLimit),
      }
    );
  } catch (error) {
    return errorResponse(
      '服务器内部错误',
      process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      500
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const checkResult = checkAuthAndRateLimit(request);
    if (checkResult instanceof NextResponse) {
      return checkResult;
    }

    const { searchParams } = new URL(request.url);
    const validationResult = QueryRoutingLogsSchema.safeParse({
      limit: searchParams.get('limit') || undefined,
    });

    const limit = validationResult.success ? validationResult.data.limit : 20;

    const db = getDatabase();
    const logs = db.prepare(`
      SELECT
        id,
        input_text as inputText,
        recommended_agent_id as recommendedAgentId,
        recommended_score as recommendedScore,
        user_selected_agent_id as userSelectedAgentId,
        was_accepted as wasAccepted,
        created_at as createdAt
      FROM routing_logs
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN was_accepted = 1 THEN 1 ELSE 0 END), 0) as accepted
      FROM routing_logs
    `).get() as { total: number; accepted: number } | undefined;

    const total = stats?.total ?? 0;
    const accepted = stats?.accepted ?? 0;
    const acceptanceRate = total > 0 ? Number(((accepted / total) * 100).toFixed(2)) : 0;

    return NextResponse.json(
      {
        success: true,
        logs,
        count: logs.length,
        limit,
        metrics: {
          total,
          accepted,
          acceptanceRate,
        },
      },
      { headers: rateLimitHeaders(checkResult.rateLimit) }
    );
  } catch (error) {
    return errorResponse(
      '服务器内部错误',
      process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      500
    );
  }
}
