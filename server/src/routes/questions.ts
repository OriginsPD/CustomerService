import { Hono } from "hono";
import { db } from "../db/connection.js";
import { dynamicQuestions } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateRandomQuestions } from "../services/ai.service.js";

export const questionsRoutes = new Hono()
  // GET /api/questions/active — Fetch current active questions for the checkout form
  .get("/active", async (c) => {
    const active = await db.query.dynamicQuestions.findMany({
      where: eq(dynamicQuestions.isActive, true),
      orderBy: (questions, { asc }) => [asc(questions.displayOrder)],
    });
    return c.json(active);
  })

  // GET /api/questions/random — Generate and return 3 fresh AI questions
  .get("/random", async (c) => {
    const rawQuestions = await generateRandomQuestions();
    
    // Persist to DB so they can be referenced by feedback answers.
    // We mark them as source: 'ai_generated' and isActive: false 
    // to distinguish them from the "official" 24h batch questions.
    const questions = await Promise.all(
      rawQuestions.map(async (q) => {
        const id = nanoid();
        const [inserted] = await db
          .insert(dynamicQuestions)
          .values({
            id,
            text: q.text,
            type: q.type,
            isActive: false,
            source: "ai_generated",
          })
          .returning();
        return inserted;
      })
    );

    return c.json(questions);
  });
