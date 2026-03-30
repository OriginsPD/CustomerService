import { db } from "../db/connection.js";
import { sessions, feedback, dynamicQuestions, aiDecisionLog } from "../db/schema.js";
import { eq, gte, sql, desc, count, avg } from "drizzle-orm";
import { extractKeywords, generateInsights } from "./ai.service.js";

/** Returns the dashboard summary aggregate */
export async function getDashboardSummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalVisitsAllTime,
    totalVisitsToday,
    avgRatingAll,
    avgRatingToday,
    sentimentCounts,
    currentQueue,
    activeQuestionsCount,
    lastAiRun,
    advancedStatsData,
  ] = await Promise.all([
    // Total sessions all time
    db.select({ count: count() }).from(sessions),

    // Total sessions today
    db
      .select({ count: count() })
      .from(sessions)
      .where(gte(sessions.checkedInAt, today)),

    // Avg rating all time
    db.select({ avg: avg(feedback.rating) }).from(feedback),

    // Avg rating today
    db
      .select({ avg: avg(feedback.rating) })
      .from(feedback)
      .where(gte(feedback.submittedAt, today)),

    // Sentiment distribution
    db
      .select({
        sentiment: feedback.sentiment,
        count: count(),
      })
      .from(feedback)
      .groupBy(feedback.sentiment),

    // Current queue depth
    db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.status, "waiting")),

    // Active questions count
    db
      .select({ count: count() })
      .from(dynamicQuestions)
      .where(eq(dynamicQuestions.isActive, true)),

    // Last AI run
    db
      .select({ runAt: aiDecisionLog.runAt })
      .from(aiDecisionLog)
      .orderBy(desc(aiDecisionLog.runAt))
      .limit(1),

    // Advanced Metrics Today (Wait Time, Support Time, Abandonment)
    db
      .select({
        avgWaitSeconds: sql<number>`AVG(EXTRACT(EPOCH FROM (${sessions.calledUpAt} - ${sessions.checkedInAt})))`,
        avgHandleSeconds: sql<number>`AVG(EXTRACT(EPOCH FROM (${sessions.checkedOutAt} - ${sessions.calledUpAt})))`,
        totalCancelledToday: sql<number>`SUM(CASE WHEN ${sessions.status} = 'cancelled' THEN 1 ELSE 0 END)`,
        totalJoinedToday: count(),
      })
      .from(sessions)
      .where(gte(sessions.checkedInAt, today)),
  ]);

  // Build sentiment distribution map
  const sentimentMap: Record<string, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };
  for (const row of sentimentCounts) {
    if (row.sentiment) sentimentMap[row.sentiment] = Number(row.count);
  }
  const total = sentimentMap.positive + sentimentMap.neutral + sentimentMap.negative;
  const positivePct = total > 0 ? Math.round((sentimentMap.positive / total) * 100) : 0;

  const advanced = advancedStatsData?.[0] || { avgWaitSeconds: 0, avgHandleSeconds: 0, totalCancelledToday: 0, totalJoinedToday: 0 };
  const abandonmentRate = advanced.totalJoinedToday > 0 
    ? Math.round((Number(advanced.totalCancelledToday) / Number(advanced.totalJoinedToday)) * 100) 
    : 0;

  return {
    totalVisitsAllTime: Number(totalVisitsAllTime[0]?.count ?? 0),
    totalVisitsToday: Number(totalVisitsToday[0]?.count ?? 0),
    avgRating: Number(Number(avgRatingAll[0]?.avg ?? 0).toFixed(1)),
    avgRatingToday: Number(Number(avgRatingToday[0]?.avg ?? 0).toFixed(1)),
    currentQueueDepth: Number(currentQueue[0]?.count ?? 0),
    positiveSentimentPct: positivePct,
    sentimentDistribution: {
      positive: sentimentMap.positive,
      neutral: sentimentMap.neutral,
      negative: sentimentMap.negative,
      total,
    },
    activeQuestionsCount: Number(activeQuestionsCount[0]?.count ?? 0),
    lastAiRunAt: lastAiRun[0]?.runAt?.toISOString() ?? null,
    avgWaitTimeMinutes: advanced.avgWaitSeconds ? Math.round(Number(advanced.avgWaitSeconds) / 60) : 0,
    avgHandleTimeMinutes: advanced.avgHandleSeconds ? Math.round(Number(advanced.avgHandleSeconds) / 60) : 0,
    abandonmentRatePct: abandonmentRate,
  };
}

/** Returns 30-day trend data (daily buckets) */
export async function getTrends(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      date: sql<string>`DATE(${feedback.submittedAt})`.as("date"),
      avgRating: avg(feedback.rating),
      visitCount: count(),
      positiveCount: sql<number>`SUM(CASE WHEN ${feedback.sentiment} = 'positive' THEN 1 ELSE 0 END)`.as("positiveCount"),
      neutralCount: sql<number>`SUM(CASE WHEN ${feedback.sentiment} = 'neutral' THEN 1 ELSE 0 END)`.as("neutralCount"),
      negativeCount: sql<number>`SUM(CASE WHEN ${feedback.sentiment} = 'negative' THEN 1 ELSE 0 END)`.as("negativeCount"),
    })
    .from(feedback)
    .where(gte(feedback.submittedAt, since))
    .groupBy(sql`DATE(${feedback.submittedAt})`)
    .orderBy(sql`DATE(${feedback.submittedAt})`);

  return rows.map((r) => ({
    date: r.date,
    avgRating: Number(Number(r.avgRating ?? 0).toFixed(2)),
    visitCount: Number(r.visitCount),
    positiveCount: Number(r.positiveCount ?? 0),
    neutralCount: Number(r.neutralCount ?? 0),
    negativeCount: Number(r.negativeCount ?? 0),
  }));
}

/** Returns AI-extracted keywords from recent comments */
export async function getKeywords() {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const recentFeedback = await db
    .select({ comment: feedback.comment })
    .from(feedback)
    .where(gte(feedback.submittedAt, since))
    .limit(100);

  return extractKeywords(recentFeedback.map((f) => f.comment));
}

/** Generates operational insights from current dashboard data */
export async function getInsights() {
  const [summary, keywords, trends] = await Promise.all([
    getDashboardSummary(),
    getKeywords(),
    getTrends(14),
  ]);
  return generateInsights(summary, keywords, trends);
}

/** Returns paginated AI decision log */
export async function getAILog(page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;

  const [rows, totalCount] = await Promise.all([
    db
      .select()
      .from(aiDecisionLog)
      .orderBy(desc(aiDecisionLog.runAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(aiDecisionLog),
  ]);

  return {
    data: rows.map((r) => ({
      id: r.id,
      runAt: r.runAt.toISOString(),
      action: r.action,
      questionId: r.questionId,
      questionText: r.questionText,
      reasoning: r.reasoning,
      feedbackSampleSize: r.feedbackSampleSize,
      confidenceLevel: (r.rawAiResponse as any)?.confidenceLevel ?? null,
    })),
    total: Number(totalCount[0]?.count ?? 0),
    page,
    pageSize,
    totalPages: Math.ceil(Number(totalCount[0]?.count ?? 0) / pageSize),
  };
}

/** Returns 24-hour heatmap data from the last 30 days */
export async function getHourlyHeatmap() {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  
  const rows = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${sessions.checkedInAt})`.as("hour"),
      count: count(),
    })
    .from(sessions)
    .where(gte(sessions.checkedInAt, since))
    .groupBy(sql`EXTRACT(HOUR FROM ${sessions.checkedInAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${sessions.checkedInAt})`);

  return rows.map(r => ({
    hour: Number(r.hour),
    count: Number(r.count)
  }));
}

/** Returns sentiment distribution broken down by purpose */
export async function getSentimentByPurpose() {
  const rows = await db
    .select({
      purpose: sessions.purpose,
      positive: sql<number>`SUM(CASE WHEN ${feedback.sentiment} = 'positive' THEN 1 ELSE 0 END)`,
      neutral: sql<number>`SUM(CASE WHEN ${feedback.sentiment} = 'neutral' THEN 1 ELSE 0 END)`,
      negative: sql<number>`SUM(CASE WHEN ${feedback.sentiment} = 'negative' THEN 1 ELSE 0 END)`,
      total: count(),
    })
    .from(feedback)
    .innerJoin(sessions, eq(feedback.sessionId, sessions.id))
    .groupBy(sessions.purpose)
    .orderBy(desc(count()));

  return rows.map(r => ({
    purpose: r.purpose,
    positive: Number(r.positive ?? 0),
    neutral: Number(r.neutral ?? 0),
    negative: Number(r.negative ?? 0),
    total: Number(r.total)
  }));
}
