import { z } from "zod";
export declare const starLabels: Record<number, string>;
export declare const DynamicAnswerSchema: z.ZodObject<{
    questionId: z.ZodString;
    answer: z.ZodString;
}, "strip", z.ZodTypeAny, {
    questionId: string;
    answer: string;
}, {
    questionId: string;
    answer: string;
}>;
export type DynamicAnswer = z.infer<typeof DynamicAnswerSchema>;
export declare const CheckOutFormSchema: z.ZodObject<{
    sessionId: z.ZodString;
    rating: z.ZodNumber;
    comment: z.ZodString;
    dynamicAnswers: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        questionId: z.ZodString;
        answer: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
        answer: string;
    }, {
        questionId: string;
        answer: string;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    rating: number;
    comment: string;
    dynamicAnswers: {
        questionId: string;
        answer: string;
    }[];
}, {
    sessionId: string;
    rating: number;
    comment: string;
    dynamicAnswers?: {
        questionId: string;
        answer: string;
    }[] | undefined;
}>;
export type CheckOutForm = z.infer<typeof CheckOutFormSchema>;
export declare const SentimentEnum: z.ZodEnum<["positive", "neutral", "negative"]>;
export type Sentiment = z.infer<typeof SentimentEnum>;
export declare const FeedbackResponseSchema: z.ZodObject<{
    feedbackId: z.ZodString;
    sentiment: z.ZodEnum<["positive", "neutral", "negative"]>;
    sentimentScore: z.ZodNumber;
    thankYouMessage: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sentiment: "positive" | "neutral" | "negative";
    sentimentScore: number;
    feedbackId: string;
    thankYouMessage: string;
}, {
    sentiment: "positive" | "neutral" | "negative";
    sentimentScore: number;
    feedbackId: string;
    thankYouMessage: string;
}>;
export type FeedbackResponse = z.infer<typeof FeedbackResponseSchema>;
