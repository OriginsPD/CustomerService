import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { JWT_SECRET } from "../routes/auth.js";

/**
 * JWT middleware — protects staff-only mutation endpoints.
 * Expects:  Authorization: Bearer <token>
 */
export const staffAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized — missing Bearer token" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    // hono/jwt v4.x requires the algorithm to be specified explicitly.
    // HS256 matches the algorithm used in auth.ts sign().
    await verify(token, JWT_SECRET, "HS256");
    await next();
  } catch {
    return c.json({ error: "Unauthorized — invalid or expired token" }, 401);
  }
});
