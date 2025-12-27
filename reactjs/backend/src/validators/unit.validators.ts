import { z } from 'zod';

export const createUnitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  shortName: z.string().min(1, 'Short name is required').max(10),
  isActive: z.boolean().optional().default(true),
});

export const updateUnitSchema = createUnitSchema.partial();

export const unitQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  search: z.string().optional(),
  isActive: z.string().optional().transform((val) => (val === undefined ? undefined : val === 'true')),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type UnitQueryInput = z.infer<typeof unitQuerySchema>;

