import type { MiddlewareHandler } from "hono";
import { logger } from "../lib/logger.js";

interface RateLimitTracker {
  count: number;
  resetAt: number;
}
const ipMap = new Map<string, RateLimitTracker>();

// Memory leak prevention sweeper
setInterval(() => {
  const now = Date.now();
  for (const [ip, tracker] of ipMap.entries()) {
    if (tracker.resetAt < now) ipMap.delete(ip);
  }
}, 60 * 1000);

/**
 * Basic in-memory IP rate limiter.
 * In a distributed production env (like AWS Lambda or horizontally scaled pods),
 * this should be replaced by a Redis/Memcached backed limiter.
 */
export function rateLimiter(limit: number, windowMs: number): MiddlewareHandler {
  return async (c, next) => {
    // Vercel / Cloudflare standard forwarding header
    const forwardedStr = c.req.header("x-forwarded-for");
    const ip = forwardedStr ? forwardedStr.split(",")[0].trim() : "unknown-ip";

    // If we're behind a proxy but missing the header, or developing locally, just pass or aggregate
    if (ip === "unknown-ip" && process.env.NODE_ENV !== "development") {
      logger.warn("RateLimiter: Missing x-forwarded-for header");
    }

    const now = Date.now();
    let tracker = ipMap.get(ip);

    if (!tracker || tracker.resetAt < now) {
      tracker = { count: 0, resetAt: now + windowMs };
    }

    if (tracker.count >= limit) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`);
      return c.json({ error: "Rate limit exceeded. Try again later." }, 429);
    }

    tracker.count++;
    ipMap.set(ip, tracker);
    
    await next();
  };
}
