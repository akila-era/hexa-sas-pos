import { z } from 'zod';

// Common ID parameter validator
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

// Pagination query params
export const paginationSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
});

// Boolean query param transformer
export const booleanQuerySchema = z
  .string()
  .optional()
  .transform((val) => val === 'true');

