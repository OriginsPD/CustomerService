import { z } from "zod";

export const QuestionTypeEnum = z.enum(["text", "boolean", "scale"]);
export type QuestionType = z.infer<typeof QuestionTypeEnum>;

export const QuestionSourceEnum = z.enum(["ai_generated", "manual"]);
export type QuestionSource = z.infer<typeof QuestionSourceEnum>;

export const DynamicQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: QuestionTypeEnum,
  displayOrder: z.number(),
  source: QuestionSourceEnum,
  addedAt: z.string().datetime(),
});

export type DynamicQuestion = z.infer<typeof DynamicQuestionSchema>;

export const QuestionListSchema = z.array(DynamicQuestionSchema);
export type QuestionList = z.infer<typeof QuestionListSchema>;

export const AIActionEnum = z.enum(["add_question", "remove_question", "retain"]);
export type AIAction = z.infer<typeof AIActionEnum>;

export const AIDecisionSchema = z.object({
  action: AIActionEnum,
  questionText: z.string().optional(),
  questionType: QuestionTypeEnum.optional(),
  questionId: z.string().optional(),
  reasoning: z.string(),
});

export type AIDecision = z.infer<typeof AIDecisionSchema>;

export const AIDecisionLogSchema = z.object({
  id: z.string(),
  runAt: z.string().datetime(),
  action: AIActionEnum,
  questionId: z.string().nullable(),
  questionText: z.string().nullable(),
  reasoning: z.string(),
  feedbackSampleSize: z.number(),
});

export type AIDecisionLog = z.infer<typeof AIDecisionLogSchema>;
