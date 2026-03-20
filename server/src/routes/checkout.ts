import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import { db } from "../db/connection.js";
import { feedback, feedbackAnswers, sessions } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { CheckOutFormSchema } from "@vcc/shared";
import { analyzeSentiment } from "../services/ai.service.js";
import { deregisterSession } from "../services/queue.service.js";
import { logger } from "../lib/logger.js";

export const checkoutRoutes = new Hono()

  // POST /api/checkout — Submit feedback
  .post("/", zValidator("json", CheckOutFormSchema, (result, c) => {
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join("; ");
      logger.warn("[Checkout] Validation failed", { issues: result.error.issues });
      return c.json({ error: `Validation failed: ${message}` }, 400);
    }
  }), async (c) => {
    const body = c.req.valid("json");

    // Run sentiment analysis BEFORE the transaction so we don't hold a DB
    // lock during a slow AI network call. Fallback to neutral if AI fails.
    let sentiment = "neutral" as "positive" | "neutral" | "negative";
    let score = 0;
    let thankYouMessage = "Thank you for your feedback!";
    try {
      ({ sentiment, score, thankYouMessage } = await analyzeSentiment(body.comment));
    } catch {
      // AI failure is non-fatal — proceed with neutral defaults
    }

    const feedbackId = nanoid();

    // Wrap all DB writes in a transaction so concurrent checkout requests
    // for the same session cannot both succeed (race-condition prevention).
    // The unique index on feedback.session_id is the final duplicate guard.
    try {
      await db.transaction(async (tx) => {
        const session = await tx.query.sessions.findFirst({
          where: eq(sessions.id, body.sessionId),
        });

        if (!session) {
          throw Object.assign(new Error("Session not found"), { statusCode: 404 });
        }
        if (session.status === "cancelled") {
          throw Object.assign(new Error("This session was cancelled"), { statusCode: 410 });
        }
        if (session.status === "completed") {
          throw Object.assign(new Error("Feedback already submitted for this session"), { statusCode: 409 });
        }

        await tx.insert(feedback).values({
          id: feedbackId,
          sessionId: body.sessionId,
          rating: body.rating,
          comment: body.comment,
          sentiment: sentiment as "positive" | "neutral" | "negative",
          sentimentScore: score,
        });

        if (body.dynamicAnswers && body.dynamicAnswers.length > 0) {
          await tx.insert(feedbackAnswers).values(
            body.dynamicAnswers.map((a) => ({
              id: nanoid(),
              feedbackId,
              questionId: a.questionId,
              answer: a.answer,
            }))
          );
        }

        await tx
          .update(sessions)
          .set({ status: "completed", checkedOutAt: new Date() })
          .where(eq(sessions.id, body.sessionId));
      });
    } catch (err: any) {
      const code: number = err?.statusCode ?? 0;
      if (code === 404) return c.json({ error: err.message }, 404);
      if (code === 409) return c.json({ error: err.message }, 409);
      if (code === 410) return c.json({ error: err.message }, 410);
      logger.error("[Checkout] Unexpected error", { error: err?.message, stack: err?.stack });
      return c.json({ error: "An unexpected error occurred. Please try again." }, 500);
    }

    // Remove from in-memory queue map — O(1)
    deregisterSession(body.sessionId);

    return c.json({
      feedbackId,
      sentiment,
      sentimentScore: score,
      thankYouMessage,
    });
  })

  // GET /api/checkout/:sessionId — Get feedback for a session (O(1) index)
  .get("/:sessionId", async (c) => {
    const sessionId = c.req.param("sessionId");

    const result = await db.query.feedback.findFirst({
      where: eq(feedback.sessionId, sessionId),
      with: { answers: { with: { question: true } } },
    });

    if (!result) {
      return c.json({ error: "Feedback not found" }, 404);
    }

    return c.json({
      ...result,
      submittedAt: result.submittedAt.toISOString(),
    });
  });
