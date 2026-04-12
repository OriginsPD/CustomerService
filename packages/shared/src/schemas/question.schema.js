import { z } from "zod";
export const QuestionTypeEnum = z.enum(["text", "boolean", "scale"]);
export const QuestionSourceEnum = z.enum(["ai_generated", "manual"]);
export const DynamicQuestionSchema = z.object({
    id: z.string(),
    text: z.string(),
    type: QuestionTypeEnum,
    displayOrder: z.number(),
    source: QuestionSourceEnum,
    addedAt: z.string().datetime(),
});
export const QuestionListSchema = z.array(DynamicQuestionSchema);
export const AIActionEnum = z.enum(["add_question", "remove_question", "retain", "no_change"]);
export const AIDecisionSchema = z.object({
    action: AIActionEnum,
    questionText: z.string().optional(),
    questionType: QuestionTypeEnum.optional(),
    questionId: z.string().optional(),
    reasoning: z.string(),
});
export const AIDecisionLogSchema = z.object({
    id: z.string(),
    runAt: z.string().datetime(),
    action: AIActionEnum,
    questionId: z.string().nullable(),
    questionText: z.string().nullable(),
    reasoning: z.string(),
    feedbackSampleSize: z.number(),
});
