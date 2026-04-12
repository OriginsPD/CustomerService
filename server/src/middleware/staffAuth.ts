import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { JWT_SECRET } from "../routes/auth.js";

type StaffPayload = {
  sub: string;
  username: string;
  role: "superadmin" | "admin" | "agent";
  fullName: string;
  exp: number;
};

/**
 * JWT middleware — protects staff-only mutation endpoints.
 * Extracts user info and stores it in context.
 */
export const staffAuth = createMiddleware<{
  Variables: {
    staff: StaffPayload;
  };
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized — missing Bearer token" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = (await verify(token, JWT_SECRET, "HS256")) as StaffPayload;
    
    // Check if staff is still valid in context if needed, but for now just pass payload
    c.set("staff", payload);
    
    await next();
  } catch (err) {
    return c.json({ error: "Unauthorized — invalid or expired token" }, 401);
  }
});

/**
 * Higher-order middleware to restrict routes by role.
 * Must be used AFTER staffAuth.
 */
export const roleAuth = (allowedRoles: Array<"superadmin" | "admin" | "agent">) => {
  return createMiddleware<{
    Variables: {
      staff: StaffPayload;
    };
  }>(async (c, next) => {
    const staff = c.get("staff");
    
    if (!staff || !allowedRoles.includes(staff.role)) {
      return c.json({ error: "Forbidden — insufficient permissions" }, 403);
    }
    
    await next();
  });
};
