import { Hono } from "hono";
import { runAnalysis } from "../services/scheduler.service.js";
import { initQueueMap } from "../services/queue.service.js";
import { staffAuth } from "../middleware/staffAuth.js";
import { db } from "../db/connection.js";
import { sessions } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const adminRoutes = new Hono()

  // POST /api/admin/run-analysis — Manually trigger 24h AI analysis (staff JWT required)
  .post("/run-analysis", staffAuth, async (c) => {
    const result = await runAnalysis();
    return c.json(result, result.status === "error" ? 500 : 200);
  })

  // POST /api/admin/flush-queue — Re-sync in-memory queue map from DB (staff JWT required)
  .post("/flush-queue", staffAuth, async (c) => {
    await initQueueMap();
    return c.json({ success: true });
  })

  // PATCH /api/admin/sessions/:sessionId/complete — Staff manually completes a session
  .patch("/sessions/:sessionId/complete", staffAuth, async (c) => {
    const sessionId = c.req.param("sessionId");
    const updated = await db
      .update(sessions)
      .set({ status: "completed", checkedOutAt: new Date() })
      .where(eq(sessions.id, sessionId))
      .returning({ id: sessions.id });

    if (!updated.length) {
      return c.json({ error: "Session not found" }, 404);
    }
    return c.json({ success: true });
  });
