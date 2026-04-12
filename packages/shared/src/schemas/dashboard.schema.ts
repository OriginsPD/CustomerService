import { z } from "zod";

export const OperationalSummarySchema = z.object({
  activeSessions: z.number(),
  avgWaitTime: z.number(),
  completedToday: z.number(),
  sentimentScore: z.number(),
});

export type OperationalSummary = z.infer<typeof OperationalSummarySchema>;

export const SentimentTrendSchema = z.object({
  date: z.string(),
  positive: z.number(),
  neutral: z.number(),
  negative: z.number(),
});

export type SentimentTrend = z.infer<typeof SentimentTrendSchema>;

export const KeywordAnalysisSchema = z.object({
  word: z.string(),
  count: z.number(),
  sentiment: z.enum(["positive", "neutral", "negative"]),
});

export type KeywordAnalysis = z.infer<typeof KeywordAnalysisSchema>;

export const AILogEntrySchema = z.object({
  id: z.string(),
  action: z.string(),
  reasoning: z.string(),
  input: z.any(),
  output: z.any(),
  timestamp: z.string().datetime(),
});

export type AILogEntry = z.infer<typeof AILogEntrySchema>;

export const TwilioConfigSchema = z.object({
  accountSid: z.string().startsWith("AC", "Account SID must start with AC").length(34, "Account SID must be 34 characters"),
  authToken: z.string().length(32, "Auth Token must be 32 characters"),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid E.164 phone number (e.g. +18885550000)"),
});

export type TwilioConfig = z.infer<typeof TwilioConfigSchema>;

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
  sentiment: z.enum(["positive", "neutral", "negative"]),
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
  lastAiRunAt: z.string().nullable(),
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;

export const QueueItemSchema = z.object({
  sessionId: z.string(),
  clientName: z.string(),
  purpose: z.string(),
  queueNumber: z.number(),
  queuePosition: z.number(),
  checkedInAt: z.string(),
  estimatedWaitMinutes: z.number(),
});
export type QueueItem = z.infer<typeof QueueItemSchema>;
