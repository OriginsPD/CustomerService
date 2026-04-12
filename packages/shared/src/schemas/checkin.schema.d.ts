import { z } from "zod";
export declare const purposeOptions: readonly ["General Inquiry", "Account Services", "Technical Support", "Billing Question", "Product Demo", "Partnership Discussion", "Other"];
export declare const CheckInFormSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    company: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    purpose: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    purpose: string;
    phone?: string | undefined;
    company?: string | undefined;
}, {
    name: string;
    email: string;
    purpose: string;
    phone?: string | undefined;
    company?: string | undefined;
}>;
export type CheckInForm = z.infer<typeof CheckInFormSchema>;
export declare const CheckInResponseSchema: z.ZodObject<{
    sessionId: z.ZodString;
    queueNumber: z.ZodNumber;
    queuePosition: z.ZodNumber;
    estimatedWaitMinutes: z.ZodNumber;
    checkedInAt: z.ZodString;
    clientName: z.ZodString;
    purpose: z.ZodString;
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
export type CheckInResponse = z.infer<typeof CheckInResponseSchema>;
export declare const SessionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    company: z.ZodNullable<z.ZodString>;
    purpose: z.ZodString;
    queueNumber: z.ZodNumber;
    status: z.ZodEnum<["waiting", "in_progress", "completed", "cancelled"]>;
    checkedInAt: z.ZodString;
    checkedOutAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "waiting" | "in_progress" | "completed" | "cancelled";
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    purpose: string;
    queueNumber: number;
    checkedInAt: string;
    checkedOutAt: string | null;
}, {
    status: "waiting" | "in_progress" | "completed" | "cancelled";
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    purpose: string;
    queueNumber: number;
    checkedInAt: string;
    checkedOutAt: string | null;
}>;
export type Session = z.infer<typeof SessionSchema>;
