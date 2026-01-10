import { z } from "zod";

/**
 * Validation schemas for calculation API endpoints
 * Requirements: 9.2
 */

// Valid tool slugs - extend as new tools are added
export const validToolSlugs = ["profit-margin-calculator"] as const;

/**
 * Profit margin calculator inputs schema
 */
export const profitMarginInputsSchema = z.object({
  costPrice: z.number().positive("Cost price must be positive"),
  sellingPrice: z.number().positive("Selling price must be positive"),
});

/**
 * Profit margin calculator outputs schema
 */
export const profitMarginOutputsSchema = z.object({
  profit: z.number(),
  profitMargin: z.number(),
  markup: z.number(),
  isLoss: z.boolean(),
});

/**
 * Schema for creating a new calculation
 */
export const createCalculationSchema = z.object({
  toolSlug: z.enum(validToolSlugs, {
    message: "Invalid tool slug",
  }),
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
});

/**
 * Schema for profit margin calculation specifically
 */
export const createProfitMarginCalculationSchema = z.object({
  toolSlug: z.literal("profit-margin-calculator"),
  inputs: profitMarginInputsSchema,
  outputs: profitMarginOutputsSchema,
});

/**
 * Query params schema for listing calculations
 */
export const listCalculationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  toolSlug: z.enum(validToolSlugs).optional(),
});

/**
 * Schema for calculation ID parameter
 */
export const calculationIdSchema = z.object({
  id: z.string().min(1, "Calculation ID is required"),
});

// Type exports
export type CreateCalculationInput = z.infer<typeof createCalculationSchema>;
export type CreateProfitMarginCalculationInput = z.infer<typeof createProfitMarginCalculationSchema>;
export type ListCalculationsQuery = z.infer<typeof listCalculationsQuerySchema>;
export type CalculationId = z.infer<typeof calculationIdSchema>;
