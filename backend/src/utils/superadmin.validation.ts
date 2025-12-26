import { z } from 'zod';

// ==========================================
// PACKAGE VALIDATIONS
// ==========================================

export const packageCreateSchema = z.object({
  name: z.string().min(1, 'Package name is required'),
  type: z.enum(['Monthly', 'Yearly']),
  price: z.number().min(0),
  discount: z.number().min(0).default(0),
  discountType: z.enum(['Fixed', 'Percentage']).optional(),
  maxCustomers: z.number().int().positive().optional(),
  maxProducts: z.number().int().positive().optional(),
  maxInvoices: z.number().int().positive().optional(),
  maxSuppliers: z.number().int().positive().optional(),
  modules: z.array(z.string()).default([]),
  isRecommended: z.boolean().default(false),
  trialDays: z.number().int().min(0).default(0),
  position: z.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  description: z.string().optional(),
  image: z.string().optional(),
});

export const packageUpdateSchema = packageCreateSchema.partial();

// ==========================================
// COMPANY (TENANT) VALIDATIONS
// ==========================================

export const superAdminCompanyCreateSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  accountUrl: z.string().optional(),
  currency: z.string().default('USD'),
  language: z.string().default('English'),
  plan: z.string().default('FREE'),
  isActive: z.boolean().default(true),
  logo: z.string().optional(),
  // For initial admin user
  password: z.string().min(6).optional(),
});

export const superAdminCompanyUpdateSchema = superAdminCompanyCreateSchema.partial();

export const companyUpgradeSchema = z.object({
  packageId: z.string().uuid('Invalid package ID'),
  planName: z.string().optional(),
  planType: z.enum(['Monthly', 'Yearly']),
  amount: z.number().min(0),
  paymentDate: z.string().or(z.date()),
  nextPaymentDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()),
});

// ==========================================
// SUBSCRIPTION VALIDATIONS
// ==========================================

export const subscriptionCreateSchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
  packageId: z.string().uuid('Invalid package ID'),
  billingCycle: z.number().int().positive().default(30),
  amount: z.number().min(0),
  paymentMethod: z.string().min(1),
  status: z.enum(['PAID', 'UNPAID', 'EXPIRED']).default('PAID'),
  startDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()),
});

export const subscriptionUpdateSchema = subscriptionCreateSchema.partial();

// ==========================================
// DOMAIN VALIDATIONS
// ==========================================

export const domainCreateSchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
  domainUrl: z.string().min(1, 'Domain URL is required'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
});

export const domainUpdateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

// ==========================================
// TRANSACTION VALIDATIONS
// ==========================================

export const transactionCreateSchema = z.object({
  subscriptionId: z.string().uuid('Invalid subscription ID'),
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().min(0),
  paymentMethod: z.string().min(1),
  status: z.enum(['PAID', 'UNPAID', 'REFUNDED']).default('PAID'),
});

// ==========================================
// QUERY VALIDATIONS
// ==========================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const companyFilterSchema = paginationSchema.extend({
  status: z.enum(['active', 'inactive', 'all']).optional(),
  plan: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const subscriptionFilterSchema = paginationSchema.extend({
  status: z.enum(['PAID', 'UNPAID', 'EXPIRED', 'all']).optional(),
  plan: z.string().optional(),
  companyId: z.string().uuid().optional(),
});

export const domainFilterSchema = paginationSchema.extend({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'all']).optional(),
  planType: z.enum(['Monthly', 'Yearly', 'all']).optional(),
});

export const transactionFilterSchema = paginationSchema.extend({
  status: z.enum(['PAID', 'UNPAID', 'REFUNDED', 'all']).optional(),
  paymentMethod: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ==========================================
// SUPER ADMIN USER VALIDATIONS
// ==========================================

export const superAdminUserCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  isActive: z.boolean().default(true),
});

export const superAdminUserUpdateSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const superAdminUserFilterSchema = paginationSchema.extend({
  status: z.enum(['active', 'inactive', 'all']).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type PackageCreate = z.infer<typeof packageCreateSchema>;
export type PackageUpdate = z.infer<typeof packageUpdateSchema>;
export type SuperAdminCompanyCreate = z.infer<typeof superAdminCompanyCreateSchema>;
export type SuperAdminCompanyUpdate = z.infer<typeof superAdminCompanyUpdateSchema>;
export type CompanyUpgrade = z.infer<typeof companyUpgradeSchema>;
export type SubscriptionCreate = z.infer<typeof subscriptionCreateSchema>;
export type SubscriptionUpdate = z.infer<typeof subscriptionUpdateSchema>;
export type DomainCreate = z.infer<typeof domainCreateSchema>;
export type DomainUpdate = z.infer<typeof domainUpdateSchema>;
export type TransactionCreate = z.infer<typeof transactionCreateSchema>;
export type CompanyFilter = z.infer<typeof companyFilterSchema>;
export type SubscriptionFilter = z.infer<typeof subscriptionFilterSchema>;
export type DomainFilter = z.infer<typeof domainFilterSchema>;
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;
export type SuperAdminUserCreate = z.infer<typeof superAdminUserCreateSchema>;
export type SuperAdminUserUpdate = z.infer<typeof superAdminUserUpdateSchema>;
export type SuperAdminUserFilter = z.infer<typeof superAdminUserFilterSchema>;

