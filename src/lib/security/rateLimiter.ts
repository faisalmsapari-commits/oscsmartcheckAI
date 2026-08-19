interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

/**
 * In-memory sliding-window rate limiter for sensitive endpoints
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { windowMs: 60000, maxRequests: 60 }
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetInMs: options.windowMs,
    };
  }

  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, entry.resetAt - now),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetInMs: Math.max(0, entry.resetAt - now),
  };
}

/**
 * Clears rate limit store (for testing)
 */
export function resetRateLimits(): void {
  rateLimitStore.clear();
}
