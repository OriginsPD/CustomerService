import { z } from "zod";

export const purposeOptions = [
  "General Inquiry",
  "Account Services",
  "Technical Support",
  "Billing Question",
  "Product Demo",
  "Partnership Discussion",
  "Other",
] as const;

export const CheckInFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,20}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  company: z
    .string()
    .max(100, "Company name must be under 100 characters")
    .optional()
    .or(z.literal("")),
  purpose: z.string().min(3, "Please describe your purpose of visit"),
});

export type CheckInForm = z.infer<typeof CheckInFormSchema>;

export const CheckInResponseSchema = z.object({
  sessionId: z.string(),
  queueNumber: z.number(),
  queuePosition: z.number(),
  estimatedWaitMinutes: z.number(),
  checkedInAt: z.string().datetime(),
  clientName: z.string(),
  purpose: z.string(),
});

export type CheckInResponse = z.infer<typeof CheckInResponseSchema>;

export const SessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  purpose: z.string(),
  queueNumber: z.number(),
  status: z.enum(["waiting", "in_progress", "completed", "cancelled"]),
  checkedInAt: z.string().datetime(),
  checkedOutAt: z.string().datetime().nullable(),
});

export type Session = z.infer<typeof SessionSchema>;
