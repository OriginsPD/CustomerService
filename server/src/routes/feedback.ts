import { Hono } from "hono";
import { db } from "../db/connection.js";
import { feedback } from "../db/schema.js";
import { eq, desc, count } from "drizzle-orm";
import { staffAuth } from "../middleware/staffAuth.js";

export const feedbackRoutes = new Hono()

  // GET /api/feedback — Paginated feedback list (admin)
  .get("/", async (c) => {
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query("pageSize") ?? "20", 10)));
    const offset = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      db.query.feedback.findMany({
        with: { session: true, answers: { with: { question: true } } },
        orderBy: [desc(feedback.submittedAt)],
        limit: pageSize,
        offset,
      }),
      db.select({ count: count() }).from(feedback),
    ]);

    return c.json({
      data: rows.map((f) => ({
        id: f.id,
        sessionId: f.sessionId,
        clientName: f.session.name,
        rating: f.rating,
        comment: f.comment,
        sentiment: f.sentiment,
        sentimentScore: f.sentimentScore,
        submittedAt: f.submittedAt.toISOString(),
        answers: f.answers.map((a) => ({
          question: a.question.text,
          answer: a.answer,
        })),
      })),
      total: Number(total[0]?.count ?? 0),
      page,
      pageSize,
    });
  })

  // GET /api/feedback/export — Download all feedback as CSV (staff JWT required)
  .get("/export", staffAuth, async (c) => {
    const rows = await db.query.feedback.findMany({
      with: { session: true },
      orderBy: [desc(feedback.submittedAt)],
    });

    const escape = (v: string | number | null | undefined) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const header = ["id", "clientName", "email", "purpose", "rating", "sentiment", "sentimentScore", "comment", "submittedAt"];
    const lines = [
      header.join(","),
      ...rows.map((f) =>
        [
          f.id,
          f.session.name,
          f.session.email,
          f.session.purpose,
          f.rating,
          f.sentiment,
          f.sentimentScore,
          f.comment,
          f.submittedAt.toISOString(),
        ]
          .map(escape)
          .join(",")
      ),
    ];

    const csv = lines.join("\n");
    const filename = `vcc-feedback-${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  })

  // GET /api/feedback/:id — Single feedback entry (O(1) PK)
  .get("/:id", async (c) => {
    const id = c.req.param("id");

    const result = await db.query.feedback.findFirst({
      where: eq(feedback.id, id),
      with: { session: true, answers: { with: { question: true } } },
    });

    if (!result) return c.json({ error: "Not found" }, 404);

    return c.json({
      ...result,
      submittedAt: result.submittedAt.toISOString(),
    });
  });
