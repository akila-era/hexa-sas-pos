import { z } from 'zod';

/**
 * Validation schemas using Zod
 */

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Common validation helpers
export const validateRequest = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> => {
  return schema.parse(data);
};

// Company validation
export const companyCreateSchema = z.object({
  name: z.string().min(1).max(255),
  legalName: z.string().max(255).optional(),
  registrationNumber: z.string().max(100).optional(),
  taxId: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
});

export const companyUpdateSchema = companyCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
  plan: z.string().optional(),
  accountUrl: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
});

// Branch validation
export const branchCreateSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  managerId: z.string().uuid().optional(),
});

export const branchUpdateSchema = branchCreateSchema.partial().omit({ code: true });

// User validation
export const userRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  companyId: z.string().uuid(),
  roleId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
});

// Super Admin registration schema (companyId optional - will auto-create system company)
export const superAdminRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const userUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional(),
  roleId: z.string().uuid().optional(),
  branchId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

// Product validation
export const productCreateSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  barcode: z.string().max(100).optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  basePrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  costPrice: z.coerce.number().nonnegative().optional(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  minStockLevel: z.number().int().min(0).default(0),
  maxStockLevel: z.number().int().min(0).optional(),
  weight: z.coerce.number().nonnegative().optional(),
  dimensions: z.string().max(50).optional(),
  warrantyPeriod: z.number().int().positive().optional(),
  expiryDate: z.string().datetime().optional(),
  isFeatured: z.boolean().default(false),
});

export const productUpdateSchema = productCreateSchema.partial().omit({ sku: true });

// POS Order validation
export const posOrderCreateSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      unitPrice: z.coerce.number().nonnegative(),
    })
  ).min(1),
  paymentMethodId: z.string().uuid().optional(),
  discountAmount: z.coerce.number().min(0).default(0),
  warehouseId: z.string().uuid().optional(),
});

// Sale validation
export const saleCreateSchema = z.object({
  customerId: z.string().uuid().optional(),
  saleDate: z.string().datetime(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      unitPrice: z.coerce.number().nonnegative(),
      taxRate: z.coerce.number().min(0).max(100).default(0),
      discountAmount: z.coerce.number().min(0).default(0),
    })
  ).min(1),
  discountAmount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
});

// Customer validation
export const customerCreateSchema = z.object({
  customerCode: z.string().max(50).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  companyName: z.string().max(255).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  taxId: z.string().max(50).optional(),
  creditLimit: z.coerce.number().nonnegative().optional(),
  customerGroup: z.string().max(50).optional(),
});

export const customerUpdateSchema = customerCreateSchema.partial();

// Stock Movement validation
export const stockMovementCreateSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  movementType: z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'RETURN']),
  quantity: z.number().int(),
  referenceType: z.string().max(50).optional(),
  referenceId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

