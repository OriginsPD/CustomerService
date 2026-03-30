import { z } from "zod";
import { SentimentEnum } from "./checkout.schema.js";

export const SentimentDistributionSchema = z.object({
  positive: z.number(),
  neutral: z.number(),
  negative: z.number(),
  total: z.number(),
});

export type SentimentDistribution = z.infer<typeof SentimentDistributionSchema>;

export const TrendPointSchema = z.object({
  date: z.string(),
  avgRating: z.number(),
  visitCount: z.number(),
  positiveCount: z.number(),
  neutralCount: z.number(),
  negativeCount: z.number(),
});

export type TrendPoint = z.infer<typeof TrendPointSchema>;

export const KeywordSchema = z.object({
  word: z.string(),
  count: z.number(),
  sentiment: SentimentEnum,
});

export type Keyword = z.infer<typeof KeywordSchema>;

export const OperationalInsightSchema = z.object({
  type: z.enum(["warning", "info", "success"]),
  title: z.string(),
  description: z.string(),
  metric: z.string().optional(),
});

export type OperationalInsight = z.infer<typeof OperationalInsightSchema>;

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
  avgWaitTimeMinutes: z.number().optional(),
  avgHandleTimeMinutes: z.number().optional(),
  abandonmentRatePct: z.number().optional(),
});

export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;

export const HourlyHeatmapSchema = z.object({
  hour: z.number(),
  count: z.number(),
});
export type HourlyHeatmap = z.infer<typeof HourlyHeatmapSchema>;

export const SentimentPurposeSchema = z.object({
  purpose: z.string(),
  positive: z.number(),
  neutral: z.number(),
  negative: z.number(),
  total: z.number(),
});
export type SentimentPurpose = z.infer<typeof SentimentPurposeSchema>;

export const QueueItemSchema = z.object({
  sessionId: z.string(),
  clientName: z.string(),
  purpose: z.string(),
  queueNumber: z.number(),
  queuePosition: z.number(),
  checkedInAt: z.string().datetime(),
  estimatedWaitMinutes: z.number(),
});

export type QueueItem = z.infer<typeof QueueItemSchema>;
