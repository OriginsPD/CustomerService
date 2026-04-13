import { Hono } from "hono";
import { db } from "../db/connection.js";
import { dynamicQuestions, sessionQuestions } from "../db/schema.js";
import { eq, asc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { staffAuth } from "../middleware/staffAuth.js";

export const questionRoutes = new Hono()

  // GET /api/questions/active — Active questions sorted by display order
  .get("/active", async (c) => {
    const questions = await db
      .select()
      .from(dynamicQuestions)
      .where(eq(dynamicQuestions.isActive, true))
      .orderBy(asc(dynamicQuestions.displayOrder));

    return c.json(
      questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        displayOrder: q.displayOrder,
        source: q.source,
        addedAt: q.addedAt.toISOString(),
      }))
    );
  })

  // GET /api/questions/session/:sessionId — Fetch all questions for a specific checkout
  .get("/session/:sessionId", async (c) => {
    const sessionId = c.req.param("sessionId");

    // 1. Fetch Global Questions
    const globalQuestions = await db
      .select()
      .from(dynamicQuestions)
      .where(eq(dynamicQuestions.isActive, true))
      .orderBy(asc(dynamicQuestions.displayOrder));

    // 2. Fetch Session-Specific Questions (AI generated)
    const specificQuestions = await db
      .select()
      .from(sessionQuestions)
      .where(eq(sessionQuestions.sessionId, sessionId))
      .orderBy(asc(sessionQuestions.generatedAt));

    const allQuestions = [
      ...globalQuestions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        source: q.source,
        isSessionSpecific: false,
      })),
      ...specificQuestions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        source: "ai_generated",
        isSessionSpecific: true,
      })),
    ];

    return c.json(allQuestions);
  })

  // POST /api/questions — Manually add a question (staff JWT required)
  .post("/", staffAuth, async (c) => {
    const body = await c.req.json<{
      text: string;
      type?: "text" | "boolean" | "scale";
    }>();

    if (!body.text || body.text.trim().length < 5) {
      return c.json({ error: "Question text must be at least 5 characters" }, 400);
    }

    const existing = await db
      .select({ displayOrder: dynamicQuestions.displayOrder })
      .from(dynamicQuestions)
      .where(eq(dynamicQuestions.isActive, true))
      .orderBy(asc(dynamicQuestions.displayOrder));

    const nextOrder =
      existing.length > 0
        ? existing[existing.length - 1].displayOrder + 1
        : 1;

    const id = nanoid();
    await db.insert(dynamicQuestions).values({
      id,
      text: body.text.trim(),
      type: body.type ?? "text",
      isActive: true,
      source: "manual",
      displayOrder: nextOrder,
    });

    return c.json({ id, success: true }, 201);
  })

  // PATCH /api/questions/:id/deactivate — Deactivate a question (staff JWT required)
  .patch("/:id/deactivate", staffAuth, async (c) => {
    const id = c.req.param("id");

    await db
      .update(dynamicQuestions)
      .set({ isActive: false, removedAt: new Date() })
      .where(eq(dynamicQuestions.id, id));

    return c.json({ success: true });
  });
