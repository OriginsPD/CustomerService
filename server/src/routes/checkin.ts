import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import { db } from "../db/connection.js";
import { sessions, cancellationFeedback } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { CheckInFormSchema } from "@vcc/shared";
import {
  registerSession,
  deregisterSession,
  getNextQueueNumber,
  getQueuePosition,
  getEstimatedWaitMinutes,
} from "../services/queue.service.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

export const checkinRoutes = new Hono()

  // POST /api/checkin — Register a new client (Limit 5 requests per 10 minutes)
  .post("/", rateLimiter(5, 10 * 60 * 1000), zValidator("json", CheckInFormSchema, (result, c) => {
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join("; ");
      return c.json({ error: `Validation failed: ${message}` }, 400);
    }
  }), async (c) => {
    const body = c.req.valid("json");

    const sessionId = nanoid();
    const queueNumber = await getNextQueueNumber();

    await db.insert(sessions).values({
      id: sessionId,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      company: body.company || null,
      purpose: body.purpose,
      queueNumber,
      status: "waiting",
    });

    // Update in-memory queue map — O(1)
    registerSession(sessionId, queueNumber);

    const queuePosition = getQueuePosition(sessionId) ?? 1;
    const estimatedWaitMinutes = getEstimatedWaitMinutes(sessionId);

    return c.json({
      sessionId,
      queueNumber,
      queuePosition,
      estimatedWaitMinutes,
      checkedInAt: new Date().toISOString(),
      clientName: body.name,
      purpose: body.purpose,
    });
  })

  // GET /api/checkin/:id — Fetch session by ID (O(1) PK lookup)
  .get("/:id", async (c) => {
    const id = c.req.param("id");

    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, id),
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    return c.json({
      ...session,
      checkedInAt: session.checkedInAt.toISOString(),
      checkedOutAt: session.checkedOutAt?.toISOString() ?? null,
    });
  })

  // POST /api/checkin/:id/cancel — Cancel a session and store cancellation feedback
  .post("/:id/cancel", async (c) => {
    const id = c.req.param("id");

    // Parse body safely — malformed JSON yields a clear 400 rather than an unhandled 500
    let body: { reason: string; wouldReschedule: boolean; additionalComment?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid request body" }, 400);
    }

    if (!body.reason) {
      return c.json({ error: "Reason is required" }, 400);
    }

    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, id),
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }
    // Allow cancellation from "waiting" and "in_progress" so clients who have
    // already been called up can still cancel before submitting checkout feedback.
    if (session.status === "completed" || session.status === "cancelled") {
      return c.json({ error: "Session is already closed" }, 409);
    }

    await db.transaction(async (tx) => {
      await tx.insert(cancellationFeedback).values({
        id: nanoid(),
        sessionId: id,
        reason: body.reason,
        wouldReschedule: body.wouldReschedule ?? false,
        additionalComment: body.additionalComment || null,
      });

      await tx
        .update(sessions)
        .set({ status: "cancelled" })
        .where(eq(sessions.id, id));
    });

    deregisterSession(id);

    return c.json({ success: true });
  })

  // PATCH /api/checkin/:id/status — Update session status
  .patch("/:id/status", async (c) => {
    const id = c.req.param("id");
    const { status } = await c.req.json<{ status: string }>();

    const validStatuses = ["waiting", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return c.json({ error: "Invalid status" }, 400);
    }

    await db
      .update(sessions)
      .set({ status: status as "waiting" | "in_progress" | "completed" | "cancelled" })
      .where(eq(sessions.id, id));

    // Keep the in-memory queue map consistent when a session is cancelled
    if (status === "cancelled") {
      deregisterSession(id);
    }

    return c.json({ success: true });
  });
