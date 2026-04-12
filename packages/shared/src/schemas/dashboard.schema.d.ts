import { z } from "zod";
export declare const SentimentDistributionSchema: z.ZodObject<{
    positive: z.ZodNumber;
    neutral: z.ZodNumber;
    negative: z.ZodNumber;
    total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
}, {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
}>;
export type SentimentDistribution = z.infer<typeof SentimentDistributionSchema>;
export declare const TrendPointSchema: z.ZodObject<{
    date: z.ZodString;
    avgRating: z.ZodNumber;
    visitCount: z.ZodNumber;
    positiveCount: z.ZodNumber;
    neutralCount: z.ZodNumber;
    negativeCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    date: string;
    avgRating: number;
    visitCount: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
}, {
    date: string;
    avgRating: number;
    visitCount: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
}>;
export type TrendPoint = z.infer<typeof TrendPointSchema>;
export declare const KeywordSchema: z.ZodObject<{
    word: z.ZodString;
    count: z.ZodNumber;
    sentiment: z.ZodEnum<["positive", "neutral", "negative"]>;
}, "strip", z.ZodTypeAny, {
    sentiment: "positive" | "neutral" | "negative";
    word: string;
    count: number;
}, {
    sentiment: "positive" | "neutral" | "negative";
    word: string;
    count: number;
}>;
export type Keyword = z.infer<typeof KeywordSchema>;
export declare const OperationalInsightSchema: z.ZodObject<{
    type: z.ZodEnum<["warning", "info", "success"]>;
    title: z.ZodString;
    description: z.ZodString;
    metric: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "info" | "warning" | "success";
    description: string;
    title: string;
    metric?: string | undefined;
}, {
    type: "info" | "warning" | "success";
    description: string;
    title: string;
    metric?: string | undefined;
}>;
export type OperationalInsight = z.infer<typeof OperationalInsightSchema>;
export declare const DashboardSummarySchema: z.ZodObject<{
    totalVisitsToday: z.ZodNumber;
    totalVisitsAllTime: z.ZodNumber;
    avgRating: z.ZodNumber;
    avgRatingToday: z.ZodNumber;
    currentQueueDepth: z.ZodNumber;
    positiveSentimentPct: z.ZodNumber;
    sentimentDistribution: z.ZodObject<{
        positive: z.ZodNumber;
        neutral: z.ZodNumber;
        negative: z.ZodNumber;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        positive: number;
        neutral: number;
        negative: number;
        total: number;
    }, {
        positive: number;
        neutral: number;
        negative: number;
        total: number;
    }>;
    activeQuestionsCount: z.ZodNumber;
    lastAiRunAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    avgRating: number;
    totalVisitsToday: number;
    totalVisitsAllTime: number;
    avgRatingToday: number;
    currentQueueDepth: number;
    positiveSentimentPct: number;
    sentimentDistribution: {
        positive: number;
        neutral: number;
        negative: number;
        total: number;
    };
    activeQuestionsCount: number;
    lastAiRunAt: string | null;
}, {
    avgRating: number;
    totalVisitsToday: number;
    totalVisitsAllTime: number;
    avgRatingToday: number;
    currentQueueDepth: number;
    positiveSentimentPct: number;
    sentimentDistribution: {
        positive: number;
        neutral: number;
        negative: number;
        total: number;
    };
    activeQuestionsCount: number;
    lastAiRunAt: string | null;
}>;
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
export declare const QueueItemSchema: z.ZodObject<{
    sessionId: z.ZodString;
    clientName: z.ZodString;
    purpose: z.ZodString;
    queueNumber: z.ZodNumber;
    queuePosition: z.ZodNumber;
    checkedInAt: z.ZodString;
    estimatedWaitMinutes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    purpose: string;
    queueNumber: number;
    checkedInAt: string;
    sessionId: string;
    queuePosition: number;
    estimatedWaitMinutes: number;
    clientName: string;
}, {
    purpose: string;
    queueNumber: number;
    checkedInAt: string;
    sessionId: string;
    queuePosition: number;
    estimatedWaitMinutes: number;
    clientName: string;
}>;
export type QueueItem = z.infer<typeof QueueItemSchema>;
