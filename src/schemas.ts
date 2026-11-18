import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Invalid email format").max(255, "Email is too long"));

export const registerSchema = z.object({
  name: z
    .string("Name is required")
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  email: emailSchema,
  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters") // лимит bcrypt
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a digit"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string("Password is required").min(1, "Password is required").max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
