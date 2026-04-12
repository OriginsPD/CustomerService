import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { db } from "../db/connection.js";
import { sessions } from "../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import {
  getQueuePosition,
  getOrderedQueue,
  getQueueDepth,
  getEstimatedWaitMinutes,
  deregisterSession,
  initQueueMap,
  queueEvents,
} from "../services/queue.service.js";
import { staffAuth } from "../middleware/staffAuth.js";

export const queueRoutes = new Hono()

  // GET /api/queue — Full queue list for staff view
  .get("/", async (c) => {
    const ordered = getOrderedQueue();
    if (ordered.length === 0) return c.json([]);

    // Fetch session details for all waiting sessions (one query)
    const sessionDetails = await db.query.sessions.findMany({
      where: and(eq(sessions.status, "waiting"), isNull(sessions.deletedAt)),
    });

    // O(1) Map lookup per session
    const detailMap = new Map(sessionDetails.map((s) => [s.id, s]));

    // Self-heal: remove any in-memory entries whose DB rows are gone
    const orphaned = ordered.filter((o) => !detailMap.has(o.sessionId));
    if (orphaned.length > 0) {
      for (const o of orphaned) deregisterSession(o.sessionId);
      // Re-fetch the pruned list
      const pruned = getOrderedQueue();
      if (pruned.length === 0) return c.json([]);
      const queueList = pruned.map((o, idx) => {
        const detail = detailMap.get(o.sessionId)!;
        return {
          sessionId: o.sessionId,
          clientName: detail.name,
          purpose: detail.purpose,
          queueNumber: o.queueNumber,
          queuePosition: idx + 1,
          checkedInAt: detail.checkedInAt.toISOString(),
          estimatedWaitMinutes: idx * 8,
        };
      });
      return c.json(queueList);
    }

    const queueList = ordered.map((o, idx) => {
      const detail = detailMap.get(o.sessionId);
      return {
        sessionId: o.sessionId,
        clientName: detail?.name ?? "Unknown",
        purpose: detail?.purpose ?? "",
        queueNumber: o.queueNumber,
        queuePosition: idx + 1,
        checkedInAt: detail?.checkedInAt.toISOString() ?? "",
        estimatedWaitMinutes: idx * 8,
      };
    });

    return c.json(queueList);
  })

  // GET /api/queue/in-progress — List of clients currently being processed
  .get("/in-progress", staffAuth, async (c) => {
    const inProgress = await db.query.sessions.findMany({
      where: and(eq(sessions.status, "in_progress"), isNull(sessions.deletedAt)),
      orderBy: (sessions, { desc }) => [desc(sessions.checkedInAt)],
    });
    return c.json(inProgress);
  })

  // GET /api/queue/depth — Current queue count
  .get("/depth", (c) => {
    return c.json({ depth: getQueueDepth() });
  })

  // GET /api/queue/stream — SSE endpoint for real-time queue updates.
  // Clients connect once and receive a "queue-update" event on every change.
  .get("/stream", (c) => {
    return streamSSE(c, async (stream) => {
      let closed = false;
      stream.onAbort(() => { closed = true; });

      // Send an immediate event so the client knows it's connected
      await stream.writeSSE({ event: "queue-update", data: "" });

      const handler = () => {
        if (!closed) {
          stream.writeSSE({ event: "queue-update", data: "" }).catch(() => { closed = true; });
        }
      };
      queueEvents.on("change", handler);

      // Keep-alive ping every 25s to prevent proxy timeouts
      while (!closed) {
        await new Promise<void>((resolve) => setTimeout(resolve, 25_000));
        if (!closed) {
          await stream.writeSSE({ event: "ping", data: "" }).catch(() => { closed = true; });
        }
      }

      queueEvents.off("change", handler);
    });
  })

  // PATCH /api/queue/:sessionId/process — Staff marks client as served (JWT required).
  // Removes from the live queue map and records the completion timestamp.
  // The client is then directed to /check-out/:sessionId to submit feedback.
  .patch("/:sessionId/process", staffAuth, async (c) => {
    const sessionId = c.req.param("sessionId");

    const updated = await db
      .update(sessions)
      .set({ status: "in_progress" })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.deletedAt)))
      .returning({ id: sessions.id });

    if (!updated.length) {
      return c.json({ error: "Session not found" }, 404);
    }

    // O(1) removal from in-memory map
    deregisterSession(sessionId);

    return c.json({ success: true, sessionId });
  })

  // GET /api/queue/position/:sessionId — O(1) position lookup
  .get("/position/:sessionId", (c) => {
    const sessionId = c.req.param("sessionId");
    const position = getQueuePosition(sessionId);

    if (position === null) {
      return c.json({ error: "Session not in queue" }, 404);
    }

    const estimatedWaitMinutes = getEstimatedWaitMinutes(sessionId);

    return c.json({
      sessionId,
      queuePosition: position,
      estimatedWaitMinutes,
    });
  });
