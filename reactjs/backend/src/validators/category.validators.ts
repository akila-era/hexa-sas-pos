import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().max(100).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  parentId: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  search: z.string().optional(),
  parentId: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  isActive: z.string().optional().transform((val) => (val === undefined ? undefined : val === 'true')),
  includeChildren: z.string().optional().transform((val) => val === 'true'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;

