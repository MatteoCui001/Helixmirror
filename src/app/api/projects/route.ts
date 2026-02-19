import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMIT_MAX } from '@/lib/rate-limit';
import { validateToken, unauthorizedResponse, isDevelopment } from '@/lib/auth';
import { CreateProjectSchema } from '@/lib/validation';
import { createProject, getAllProjects } from '@/lib/projects';

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

export async function GET(request: NextRequest) {
  try {
    const checkResult = checkAuthAndRateLimit(request);
    if (checkResult instanceof NextResponse) {
      return checkResult;
    }

    const projects = getAllProjects();
    return NextResponse.json(
      {
        success: true,
        projects,
        count: projects.length,
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

    const validationResult = CreateProjectSchema.safeParse(body);
    if (!validationResult.success) {
      const details = validationResult.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return errorResponse('参数验证失败', details, 400);
    }

    const { name, description, agentIds } = validationResult.data;
    const id = createProject(name, description, agentIds);

    return NextResponse.json(
      {
        success: true,
        id,
        name,
        description: description ?? null,
        agentIds: agentIds ?? [],
      },
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
