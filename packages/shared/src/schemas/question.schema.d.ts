import { z } from "zod";
export declare const QuestionTypeEnum: z.ZodEnum<["text", "boolean", "scale"]>;
export type QuestionType = z.infer<typeof QuestionTypeEnum>;
export declare const QuestionSourceEnum: z.ZodEnum<["ai_generated", "manual"]>;
export type QuestionSource = z.infer<typeof QuestionSourceEnum>;
export declare const DynamicQuestionSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    type: z.ZodEnum<["text", "boolean", "scale"]>;
    displayOrder: z.ZodNumber;
    source: z.ZodEnum<["ai_generated", "manual"]>;
    addedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "boolean" | "text" | "scale";
    text: string;
    id: string;
    source: "ai_generated" | "manual";
    displayOrder: number;
    addedAt: string;
}, {
    type: "boolean" | "text" | "scale";
    text: string;
    id: string;
    source: "ai_generated" | "manual";
    displayOrder: number;
    addedAt: string;
}>;
export type DynamicQuestion = z.infer<typeof DynamicQuestionSchema>;
export declare const QuestionListSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    type: z.ZodEnum<["text", "boolean", "scale"]>;
    displayOrder: z.ZodNumber;
    source: z.ZodEnum<["ai_generated", "manual"]>;
    addedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "boolean" | "text" | "scale";
    text: string;
    id: string;
    source: "ai_generated" | "manual";
    displayOrder: number;
    addedAt: string;
}, {
    type: "boolean" | "text" | "scale";
    text: string;
    id: string;
    source: "ai_generated" | "manual";
    displayOrder: number;
    addedAt: string;
}>, "many">;
export type QuestionList = z.infer<typeof QuestionListSchema>;
export declare const AIActionEnum: z.ZodEnum<["add_question", "remove_question", "retain", "no_change"]>;
export type AIAction = z.infer<typeof AIActionEnum>;
export declare const AIDecisionSchema: z.ZodObject<{
    action: z.ZodEnum<["add_question", "remove_question", "retain", "no_change"]>;
    questionText: z.ZodOptional<z.ZodString>;
    questionType: z.ZodOptional<z.ZodEnum<["text", "boolean", "scale"]>>;
    questionId: z.ZodOptional<z.ZodString>;
    reasoning: z.ZodString;
}, "strip", z.ZodTypeAny, {
    action: "add_question" | "remove_question" | "retain" | "no_change";
    reasoning: string;
    questionId?: string | undefined;
    questionText?: string | undefined;
    questionType?: "boolean" | "text" | "scale" | undefined;
}, {
    action: "add_question" | "remove_question" | "retain" | "no_change";
    reasoning: string;
    questionId?: string | undefined;
    questionText?: string | undefined;
    questionType?: "boolean" | "text" | "scale" | undefined;
}>;
export type AIDecision = z.infer<typeof AIDecisionSchema>;
export declare const AIDecisionLogSchema: z.ZodObject<{
    id: z.ZodString;
    runAt: z.ZodString;
    action: z.ZodEnum<["add_question", "remove_question", "retain", "no_change"]>;
    questionId: z.ZodNullable<z.ZodString>;
    questionText: z.ZodNullable<z.ZodString>;
    reasoning: z.ZodString;
    feedbackSampleSize: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    questionId: string | null;
    runAt: string;
    action: "add_question" | "remove_question" | "retain" | "no_change";
    questionText: string | null;
    reasoning: string;
    feedbackSampleSize: number;
}, {
    id: string;
    questionId: string | null;
    runAt: string;
    action: "add_question" | "remove_question" | "retain" | "no_change";
    questionText: string | null;
    reasoning: string;
    feedbackSampleSize: number;
}>;
export type AIDecisionLog = z.infer<typeof AIDecisionLogSchema>;
