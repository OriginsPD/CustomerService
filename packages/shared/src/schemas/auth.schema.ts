import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginForm = z.infer<typeof LoginSchema>;

export const CreateStaffSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be under 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  fullName: z
    .string()
    .min(2, "Full name is required")
    .max(50, "Full name must be under 50 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "agent"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
});

export type CreateStaffForm = z.infer<typeof CreateStaffSchema>;

export const UpdateStaffSchema = z.object({
  fullName: z.string().min(2, "Full name is required").optional(),
  role: z.enum(["admin", "agent"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

export type UpdateStaffForm = z.infer<typeof UpdateStaffSchema>;
