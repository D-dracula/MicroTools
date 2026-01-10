import { z } from "zod";

// Ad placement types
export const adPlacementSchema = z.enum([
  "landing-hero",
  "tool-sidebar",
  "tool-bottom",
]);

export type AdPlacement = z.infer<typeof adPlacementSchema>;

// Create custom ad schema
export const createCustomAdSchema = z.object({
  placement: adPlacementSchema,
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  titleAr: z.string().min(1, "Arabic title is required"),
  titleEn: z.string().min(1, "English title is required"),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL"),
  linkUrl: z.string().url("Invalid link URL"),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

// Update custom ad schema (all fields optional)
export const updateCustomAdSchema = z.object({
  placement: adPlacementSchema.optional(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  titleAr: z.string().min(1).optional(),
  titleEn: z.string().min(1).optional(),
  descriptionAr: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export type CreateCustomAdInput = z.infer<typeof createCustomAdSchema>;
export type UpdateCustomAdInput = z.infer<typeof updateCustomAdSchema>;
