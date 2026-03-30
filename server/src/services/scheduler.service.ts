import { db } from "../db/connection.js";
import { feedback, feedbackAnswers, dynamicQuestions, aiDecisionLog, sessions, cancellationFeedback } from "../db/schema.js";
import { and, gte, eq, lte, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateAdaptiveQuestions } from "./ai.service.js";
import { deregisterSession } from "./queue.service.js";

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CONSECUTIVE_FAILURES = 3; // pause scheduler after this many in a row

let schedulerTimer: NodeJS.Timeout | null = null;
let isRunning = false;
let consecutiveFailures = 0;

/**
 * Core analysis function — fetches last 24h feedback, runs AI, writes results.
 * Exported so it can be triggered manually via POST /api/admin/run-analysis.
 */
export async function runAnalysis(): Promise<{
  status: "ok" | "skipped" | "error";
  message: string;
  decisionsCount?: number;
}> {
  if (isRunning) {
    return { status: "skipped", message: "Analysis already in progress" };
  }

  isRunning = true;
  console.log("[Scheduler] Starting 24h feedback analysis...");

  try {
    const since = new Date(Date.now() - INTERVAL_MS);

    // 0. Clean up sessions older than 24 hours that are still active
    const expiredSessions = await db
      .update(sessions)
      .set({ status: "cancelled" })
      .where(
        and(
          lte(sessions.checkedInAt, since),
          inArray(sessions.status, ["waiting", "in_progress"])
        )
      )
      .returning({ id: sessions.id });

    for (const session of expiredSessions) {
      await db.insert(cancellationFeedback).values({
        id: nanoid(),
        sessionId: session.id,
        reason: "System timeout (exceeded 24 hours)",
        wouldReschedule: false,
      });
      deregisterSession(session.id);
    }
    
    if (expiredSessions.length > 0) {
      console.log(`[Scheduler] Cleaned up ${expiredSessions.length} expired sessions.`);
    }

    // 1. Fetch recent feedback (indexed query by submittedAt)
    const recentFeedback = await db.query.feedback.findMany({
      where: gte(feedback.submittedAt, since),
      with: { answers: { with: { question: true } }, session: true },
    });

    // 2. Fetch current active questions
    const activeQuestions = await db
      .select()
      .from(dynamicQuestions)
      .where(eq(dynamicQuestions.isActive, true));

    // 3. Build batch for AI
    const feedbackBatch = recentFeedback.map((f) => {
      const ms = f.session?.checkedOutAt && f.session?.checkedInAt 
        ? f.session.checkedOutAt.getTime() - f.session.checkedInAt.getTime() 
        : 0;
      
      return {
        comment: f.comment,
        rating: f.rating,
        totalDurationMinutes: Math.round(ms / 60000),
        answers: Object.fromEntries(
          f.answers.map((a) => [a.question.text, a.answer])
        ),
      };
    });

    // 4. Call AI service
    const decisions = await generateAdaptiveQuestions(feedbackBatch, activeQuestions);

    if (decisions.length === 0) {
      console.log("[Scheduler] No AI decisions returned — logging as no_change.");
      
      await db.insert(aiDecisionLog).values({
        id: nanoid(),
        action: "no_change",
        reasoning: recentFeedback.length > 0 
          ? `Analyzed ${recentFeedback.length} feedback responses. Current questions remain optimal.`
          : "Insufficient new feedback for analysis. Maintaining current state.",
        feedbackSampleSize: recentFeedback.length,
      });

      isRunning = false;
      return {
        status: "ok",
        message: "Analysis complete — no changes needed",
        decisionsCount: 0,
      };
    }

    // 5. Execute decisions
    let nextOrder = activeQuestions.length + 1;

    for (const decision of decisions) {
      const logId = nanoid();

      if (decision.action === "add_question" && decision.questionText) {
        const newId = nanoid();
        await db.insert(dynamicQuestions).values({
          id: newId,
          text: decision.questionText,
          type: decision.questionType ?? "text",
          isActive: true,
          source: "ai_generated",
          displayOrder: nextOrder++,
        });

        const rawResponse = (decision as any).confidenceLevel != null ? { confidenceLevel: (decision as any).confidenceLevel } : null;
        await db.insert(aiDecisionLog).values({
          id: logId,
          action: "add_question",
          questionId: newId,
          questionText: decision.questionText,
          reasoning: decision.reasoning,
          feedbackSampleSize: recentFeedback.length,
          rawAiResponse: rawResponse,
        });
      } else if (decision.action === "remove_question" && decision.questionId) {
        await db
          .update(dynamicQuestions)
          .set({ isActive: false, removedAt: new Date() })
          .where(eq(dynamicQuestions.id, decision.questionId));

        const rawResponse = (decision as any).confidenceLevel != null ? { confidenceLevel: (decision as any).confidenceLevel } : null;
        await db.insert(aiDecisionLog).values({
          id: logId,
          action: "remove_question",
          questionId: decision.questionId,
          questionText: null,
          reasoning: decision.reasoning,
          feedbackSampleSize: recentFeedback.length,
          rawAiResponse: rawResponse,
        });
      } else if (decision.action === "retain" && decision.questionId) {
        const rawResponse = (decision as any).confidenceLevel != null ? { confidenceLevel: (decision as any).confidenceLevel } : null;
        await db.insert(aiDecisionLog).values({
          id: logId,
          action: "retain",
          questionId: decision.questionId,
          questionText: null,
          reasoning: decision.reasoning,
          feedbackSampleSize: recentFeedback.length,
          rawAiResponse: rawResponse,
        });
      }
    }

    consecutiveFailures = 0; // reset on success
    console.log(`[Scheduler] Analysis complete. ${decisions.length} decision(s) processed.`);
    isRunning = false;
    return {
      status: "ok",
      message: `Analysis complete — ${decisions.length} decision(s) processed`,
      decisionsCount: decisions.length,
    };
  } catch (err) {
    consecutiveFailures++;
    console.error(
      `[Scheduler] Analysis failed (consecutive failures: ${consecutiveFailures}):`,
      err
    );
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(
        `[Scheduler] ${MAX_CONSECUTIVE_FAILURES} consecutive failures — pausing scheduler. ` +
          "Trigger manually via POST /api/admin/run-analysis to resume."
      );
      stopScheduler();
    }
    isRunning = false;
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/** Starts the automatic 24h scheduler on server startup */
export function startScheduler(): void {
  console.log("[Scheduler] Starting 24h auto-analysis scheduler...");

  // Run once on startup to catch up if server was down
  runAnalysis().catch(console.error);

  schedulerTimer = setInterval(() => {
    runAnalysis().catch(console.error);
  }, INTERVAL_MS);
}

export function stopScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log("[Scheduler] Stopped.");
  }
}
