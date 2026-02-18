/**
 * Rate Limit Module
 *
 * 用途：为 API 端点提供基于内存的速率限制保护，防止滥用和 DDoS 攻击
 * 使用内存存储（Map）实现简单的速率限制
 * 限制每个 IP 每分钟最多 30 次请求
 *
 * @author Claude
 * @since 2026-02-18
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
export const RATE_LIMIT_MAX = 30; // max requests per window

// 内存存储
const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * 清理过期的速率限制条目
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * 检查 IP 是否超过速率限制
 * @param ip - 客户端 IP 地址
 * @returns 速率限制结果
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetTime < now) {
    // 新窗口或窗口已过期，重置计数
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
    rateLimitMap.set(ip, newEntry);

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // 当前窗口内
  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * 从请求中获取客户端 IP
 * @param request - NextRequest 对象
 * @returns IP 地址
 */
export function getClientIp(request: Request): string {
  // 尝试从各种 header 获取真实 IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // 兜底：使用一个标识符
  return 'unknown';
}
