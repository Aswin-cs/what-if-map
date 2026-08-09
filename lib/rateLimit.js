/**
 * In-memory sliding-window rate limiter for Next.js API routes.
 *
 * Usage:
 *   import { rateLimit } from "@/lib/rateLimit";
 *   const limiter = rateLimit({ windowMs: 3 * 60 * 1000, max: 5 });
 *
 *   // Inside your handler:
 *   const rateLimitResult = limiter.check(identifier);
 *   if (!rateLimitResult.allowed) {
 *     return NextResponse.json(..., { status: 429 });
 *   }
 */

const limiters = new Map();

/**
 * Creates a rate limiter instance with a sliding window.
 *
 * @param {Object} options
 * @param {number} options.windowMs  - Time window in milliseconds (e.g. 180000 for 3 min)
 * @param {number} options.max       - Maximum requests allowed within the window
 * @param {string} [options.name]    - Optional name for this limiter (for debugging)
 * @returns {{ check: (key: string) => { allowed: boolean, remaining: number, retryAfterMs: number } }}
 */
export function rateLimit({ windowMs, max, name = "default" }) {
  // Re-use existing limiter if one with same name already exists (hot-reload safe)
  if (limiters.has(name)) {
    return limiters.get(name);
  }

  // Map<identifier, number[]> — stores timestamps of requests per key
  const tokenBuckets = new Map();

  // Periodic cleanup to prevent memory leaks (every 60s, purge expired entries)
  const CLEANUP_INTERVAL_MS = 60_000;
  let lastCleanup = Date.now();

  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;

    for (const [key, timestamps] of tokenBuckets.entries()) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        tokenBuckets.delete(key);
      } else {
        tokenBuckets.set(key, valid);
      }
    }
  }

  const limiter = {
    /**
     * Check whether a request from `key` is allowed.
     *
     * @param {string} key - Unique identifier (e.g. user email or IP)
     * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
     */
    check(key) {
      cleanup();

      const now = Date.now();
      const timestamps = tokenBuckets.get(key) || [];

      // Filter to only keep timestamps within the current window
      const validTimestamps = timestamps.filter((t) => now - t < windowMs);

      if (validTimestamps.length >= max) {
        // Rate limited — compute retry time based on the oldest request in window
        const oldestInWindow = validTimestamps[0];
        const retryAfterMs = windowMs - (now - oldestInWindow);

        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: Math.max(retryAfterMs, 0),
        };
      }

      // Allow request — record the timestamp
      validTimestamps.push(now);
      tokenBuckets.set(key, validTimestamps);

      return {
        allowed: true,
        remaining: max - validTimestamps.length,
        retryAfterMs: 0,
      };
    },
  };

  limiters.set(name, limiter);
  return limiter;
}

/**
 * Helper: extract a rate-limit identifier from a Next.js request.
 * Prefers the authenticated user's email, falls back to IP-based identification.
 *
 * @param {Request} req - The incoming request object
 * @param {Object|null} session - NextAuth session (if available)
 * @returns {string} identifier
 */
export function getRateLimitKey(req, session = null) {
  // Prefer authenticated user email
  if (session?.user?.email) {
    return `user:${session.user.email.toLowerCase()}`;
  }

  // Fallback to IP
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `ip:${ip}`;
}

/**
 * Helper: build a standardized 429 response.
 *
 * @param {number} retryAfterMs - Milliseconds until the client can retry
 * @returns {Response}
 */
export function buildRateLimitBody(retryAfterMs) {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);

  return {
    body: {
      success: false,
      error: `Too many requests. Please try again in ${retryAfterSec} seconds.`,
    },
    options: {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
      },
    },
  };
}
