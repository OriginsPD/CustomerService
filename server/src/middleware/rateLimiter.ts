import { Context, Next } from "hono";

// Naive in-memory store for IPs.
// In a large production setup, this would be replaced with Redis.
const requestLog = new Map<string, number[]>();

export const rateLimiter = (limit: number, windowMs: number) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header("x-forwarded-for") ?? "127.0.0.1";
    const now = Date.now();

    let logs = requestLog.get(ip) || [];
    // Filter out timestamps outside the window
    logs = logs.filter((timestamp) => now - timestamp < windowMs);

    if (logs.length >= limit) {
      return c.json({ error: "Too many requests. Please try again later." }, 429);
    }

    logs.push(now);
    requestLog.set(ip, logs);

    await next();
  };
};
