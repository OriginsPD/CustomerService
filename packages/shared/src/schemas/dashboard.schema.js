import { z } from "zod";
import { SentimentEnum } from "./checkout.schema.js";
export const SentimentDistributionSchema = z.object({
    positive: z.number(),
    neutral: z.number(),
    negative: z.number(),
    total: z.number(),
});
export const TrendPointSchema = z.object({
    date: z.string(),
    avgRating: z.number(),
    visitCount: z.number(),
    positiveCount: z.number(),
    neutralCount: z.number(),
    negativeCount: z.number(),
});
export const KeywordSchema = z.object({
    word: z.string(),
    count: z.number(),
    sentiment: SentimentEnum,
});
export const OperationalInsightSchema = z.object({
    type: z.enum(["warning", "info", "success"]),
    title: z.string(),
    description: z.string(),
    metric: z.string().optional(),
});
export const DashboardSummarySchema = z.object({
    totalVisitsToday: z.number(),
    totalVisitsAllTime: z.number(),
    avgRating: z.number(),
    avgRatingToday: z.number(),
    currentQueueDepth: z.number(),
    positiveSentimentPct: z.number(),
    sentimentDistribution: SentimentDistributionSchema,
    activeQuestionsCount: z.number(),
    lastAiRunAt: z.string().datetime().nullable(),
});
export const QueueItemSchema = z.object({
    sessionId: z.string(),
    clientName: z.string(),
    purpose: z.string(),
    queueNumber: z.number(),
    queuePosition: z.number(),
    checkedInAt: z.string().datetime(),
    estimatedWaitMinutes: z.number(),
});
