import { z } from "zod";

export const starLabels: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export const DynamicAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string().min(1, "Please provide an answer"),
});

export type DynamicAnswer = z.infer<typeof DynamicAnswerSchema>;

export const CheckOutFormSchema = z.object({
  sessionId: z.string(),
  rating: z
    .number()
    .int()
    .min(1, "Please select a rating")
    .max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .max(500, "Comment must be under 500 characters"),
  dynamicAnswers: z.array(DynamicAnswerSchema).optional().default([]),
});

export type CheckOutForm = z.infer<typeof CheckOutFormSchema>;

export const SentimentEnum = z.enum(["positive", "neutral", "negative"]);
export type Sentiment = z.infer<typeof SentimentEnum>;

export const FeedbackResponseSchema = z.object({
  feedbackId: z.string(),
  sentiment: SentimentEnum,
  sentimentScore: z.number().min(-1).max(1),
  thankYouMessage: z.string(),
});

export type FeedbackResponse = z.infer<typeof FeedbackResponseSchema>;
