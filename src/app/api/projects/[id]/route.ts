import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMIT_MAX } from '@/lib/rate-limit';
import { validateToken, unauthorizedResponse, isDevelopment } from '@/lib/auth';
import { UpdateProjectStatusSchema } from '@/lib/validation';
import { getProjectById, updateProjectStatus } from '@/lib/projects';

function errorResponse(message: string, details?: unknown, status: number = 400) {
  return NextResponse.json({ error: message, details }, { status });
}

function parseProjectId(rawId: string): number | null {
  const id = Number.parseInt(rawId, 10);
  if (Number.isNaN(id) || id <= 0) {
    return null;
  }
  return id;
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const checkResult = checkAuthAndRateLimit(request);
    if (checkResult instanceof NextResponse) {
      return checkResult;
    }

    const projectId = parseProjectId(params.id);
    if (!projectId) {
      return errorResponse('无效的项目 ID', undefined, 400);
    }

    const project = getProjectById(projectId);
    if (!project) {
      return errorResponse('项目不存在', undefined, 404);
    }

    return NextResponse.json(
      { success: true, project },
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const checkResult = checkAuthAndRateLimit(request);
    if (checkResult instanceof NextResponse) {
      return checkResult;
    }

    const projectId = parseProjectId(params.id);
    if (!projectId) {
      return errorResponse('无效的项目 ID', undefined, 400);
    }

    const existing = getProjectById(projectId);
    if (!existing) {
      return errorResponse('项目不存在', undefined, 404);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('请求体必须是有效的 JSON', undefined, 400);
    }

    const validationResult = UpdateProjectStatusSchema.safeParse(body);
    if (!validationResult.success) {
      const details = validationResult.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return errorResponse('参数验证失败', details, 400);
    }

    updateProjectStatus(projectId, validationResult.data.status);
    const updated = getProjectById(projectId);

    return NextResponse.json(
      { success: true, project: updated },
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
