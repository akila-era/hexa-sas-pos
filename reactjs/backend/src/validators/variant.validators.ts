import { z } from 'zod';

export const createVariantSchema = z.object({
  productId: z.number().int().positive('Product ID is required'),
  variantName: z.string().min(1, 'Variant name is required').max(100),
  variantValue: z.string().min(1, 'Variant value is required').max(100),
  sku: z.string().max(100).optional().nullable(),
  priceAdjustment: z.number().optional().default(0),
  stockQuantity: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateVariantSchema = createVariantSchema.partial().omit({ productId: true });

export const variantQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  productId: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  search: z.string().optional(),
  isActive: z.string().optional().transform((val) => (val === undefined ? undefined : val === 'true')),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type VariantQueryInput = z.infer<typeof variantQuerySchema>;

