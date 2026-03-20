import { Hono } from "hono";
import { runAnalysis } from "../services/scheduler.service.js";
import { initQueueMap } from "../services/queue.service.js";
import { staffAuth } from "../middleware/staffAuth.js";

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
  });
