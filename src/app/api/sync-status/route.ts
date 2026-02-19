import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMIT_MAX } from '@/lib/rate-limit';
import { validateToken, unauthorizedResponse, isDevelopment } from '@/lib/auth';
import { getSyncHealthStatus } from '@/lib/sync-health';

function rateLimitHeaders(rateLimit: { remaining: number; resetTime: number }) {
  return {
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
  };
}

export async function GET(request: NextRequest) {
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

  return NextResponse.json(
    {
      success: true,
      status: getSyncHealthStatus(),
    },
    { headers: rateLimitHeaders(rateLimit) }
  );
}
