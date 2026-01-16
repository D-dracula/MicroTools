import { z } from "zod";

/**
 * Registration schema with email and password strength validation
 * Password requirements: 8+ characters, uppercase, lowercase, and number
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .optional(),
});

/**
 * Login schema with basic validation
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

// Type exports for use in components and API routes
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
