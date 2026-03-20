import { Hono } from "hono";
import { db } from "../db/connection.js";
import { dynamicQuestions } from "../db/schema.js";
import { eq, asc } from "drizzle-orm";
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
