import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  sku: z.string().min(1, 'SKU is required').max(100),
  barcode: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  brandId: z.number().int().positive().optional().nullable(),
  unitId: z.number().int().positive().optional().nullable(),
  basePrice: z.number().min(0, 'Base price must be positive'),
  sellingPrice: z.number().min(0, 'Selling price must be positive'),
  costPrice: z.number().min(0).optional().nullable(),
  taxRate: z.number().min(0).max(100).optional().default(0),
  minStockLevel: z.number().int().min(0).optional().default(0),
  maxStockLevel: z.number().int().positive().optional().nullable(),
  currentStock: z.number().int().min(0).optional().default(0),
  weight: z.number().min(0).optional().nullable(),
  dimensions: z.string().max(50).optional().nullable(),
  warrantyPeriod: z.number().int().positive().optional().nullable(),
  expiryDate: z.string().datetime().optional().nullable().transform((val) => val ? new Date(val) : null),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  images: z.array(z.object({
    imageUrl: z.string().url(),
    isPrimary: z.boolean().optional().default(false),
    sortOrder: z.number().int().optional().default(0),
  })).optional(),
});

export const updateProductSchema = createProductSchema.partial().omit({ sku: true }).extend({
  sku: z.string().max(100).optional(),
});

export const productQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  search: z.string().optional(),
  categoryId: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  brandId: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  unitId: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  isActive: z.string().optional().transform((val) => (val === undefined ? undefined : val === 'true')),
  isFeatured: z.string().optional().transform((val) => (val === undefined ? undefined : val === 'true')),
  minPrice: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  maxPrice: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  sortBy: z.enum(['name', 'sellingPrice', 'createdAt', 'currentStock']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const lowStockQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  threshold: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
});

export const expiredProductsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  includeSoonExpiring: z.string().optional().transform((val) => val === 'true'),
  daysUntilExpiry: z.string().optional().default('30').transform(Number),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type LowStockQueryInput = z.infer<typeof lowStockQuerySchema>;
export type ExpiredProductsQueryInput = z.infer<typeof expiredProductsQuerySchema>;

