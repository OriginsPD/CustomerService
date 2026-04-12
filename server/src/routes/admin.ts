import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "../db/connection.js";
import { staffs, systemSettings, sessions } from "../db/schema.js";
import { staffAuth, roleAuth } from "../middleware/staffAuth.js";
import { hashPassword } from "./auth.js";
import { logger } from "../lib/logger.js";
import { runAnalysis } from "../services/scheduler.service.js";
import { initQueueMap } from "../services/queue.service.js";

export const adminRoutes = new Hono();

adminRoutes.use("*", staffAuth);

// Debug middleware to log incoming bodies for admin routes
adminRoutes.use("*", async (c, next) => {
  if (["POST", "PATCH", "PUT"].includes(c.req.method)) {
    try {
      // Use a clone of the request to avoid consuming the body stream
      const cloned = c.req.raw.clone();
      const body = await cloned.json();
      logger.info(`[Admin API] ${c.req.method} ${c.req.path} body:`, { body });
    } catch {
      logger.warn(`[Admin API] ${c.req.method} ${c.req.path} - Could not parse body as JSON`);
    }
  }
  await next();
});

// ── Session Management ───────────────────────────────────────────────────────

adminRoutes.patch("/sessions/:sessionId/complete", async (c) => {
  const sessionId = c.req.param("sessionId");
  const staff = c.get("staff");
  
  const updated = await db
    .update(sessions)
    .set({ 
      status: "completed", 
      checkedOutAt: new Date(),
      processedBy: staff.sub
    })
    .where(eq(sessions.id, sessionId))
    .returning({ id: sessions.id });

  if (!updated.length) {
    return c.json({ error: "Session not found" }, 404);
  }
  return c.json({ success: true });
});

// ── System Operations ───────────────────────────────────────────────────────

adminRoutes.post("/run-analysis", async (c) => {
  const result = await runAnalysis();
  return c.json(result, result.status === "error" ? 500 : 200);
});

adminRoutes.post("/flush-queue", async (c) => {
  await initQueueMap();
  return c.json({ success: true });
});

// ── SuperAdmin: Staff Management CRUD ────────────────────────────────────────

const createStaffSchema = z.object({
  username: z.string().min(3),
  fullName: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["admin", "agent"]),
});

adminRoutes.get("/staff", roleAuth(["superadmin"]), async (c) => {
  const allStaff = await db.query.staffs.findMany({
    where: isNull(staffs.deletedAt),
    orderBy: [desc(staffs.createdAt)],
    columns: {
      passwordHash: false,
    }
  });
  return c.json(allStaff);
});

adminRoutes.post("/staff", roleAuth(["superadmin"]), async (c) => {
  try {
    const body = await c.req.json();
    const result = createStaffSchema.safeParse(body);
    
    if (!result.success) {
      const errorMsg = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
      logger.warn(`[Admin] Staff creation validation failed: ${errorMsg}`, { body });
      return c.json({ error: errorMsg }, 400);
    }

    const data = result.data;
    const id = nanoid();
    await db.insert(staffs).values({
      id,
      username: data.username,
      fullName: data.fullName,
      passwordHash: hashPassword(data.password),
      role: data.role,
    });
    
    return c.json({ success: true, id });
  } catch (err) {
    logger.error("[Admin] Staff creation failed", { error: (err as Error).message });
    return c.json({ error: "Invalid request body" }, 400);
  }
});

const updateStaffSchema = z.object({
  fullName: z.string().optional(),
  role: z.enum(["admin", "agent"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

adminRoutes.patch("/staff/:id", roleAuth(["superadmin"]), zValidator("json", updateStaffSchema), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  
  const updateData: Partial<typeof staffs.$inferInsert> = { ...body };
  if (body.password) {
    updateData.passwordHash = hashPassword(body.password);
    delete (updateData as any).password;
  }
  
  const updated = await db.update(staffs)
    .set(updateData)
    .where(and(eq(staffs.id, id), isNull(staffs.deletedAt)))
    .returning({ id: staffs.id });
    
  if (!updated.length) return c.json({ error: "Staff member not found" }, 404);
  return c.json({ success: true });
});

adminRoutes.delete("/staff/:id", roleAuth(["superadmin"]), async (c) => {
  const id = c.req.param("id");
  
  const updated = await db.update(staffs)
    .set({ deletedAt: new Date(), isActive: false })
    .where(eq(staffs.id, id))
    .returning({ id: staffs.id });
    
  if (!updated.length) return c.json({ error: "Staff member not found" }, 404);
  return c.json({ success: true });
});

// ── SuperAdmin: System Settings ──────────────────────────────────────────────

adminRoutes.get("/settings/:id", roleAuth(["superadmin"]), async (c) => {
  const id = c.req.param("id");
  const setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.id, id),
  });
  
  if (!setting) return c.json({ id, config: {} });
  return c.json(setting);
});

adminRoutes.post("/settings/:id", roleAuth(["superadmin"]), zValidator("json", z.object({
  config: z.record(z.any()),
})), async (c) => {
  const id = c.req.param("id");
  const { config } = c.req.valid("json");
  const staff = c.get("staff");
  
  await db.insert(systemSettings)
    .values({
      id,
      config,
      updatedBy: staff.sub,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: systemSettings.id,
      set: {
        config,
        updatedBy: staff.sub,
        updatedAt: new Date(),
      }
    });
    
  return c.json({ success: true });
});
