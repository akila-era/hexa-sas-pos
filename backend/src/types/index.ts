import { Request } from 'express';
import { User, Tenant, Branch, Role, Permission } from '@prisma/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';

// Re-export AppError for convenience
export { AppErrorClass as AppError };

// Extended Express Request with authenticated user
export interface AuthRequest extends Request {
  user?: User & {
    tenant?: Tenant;
    branch?: Branch | null;
    role?: (Role & {
      permissions?: Array<{
        permission: Permission;
      }>;
    }) | null;
  };
  companyId?: string; // Maps to tenantId for backward compatibility
  branchId?: string;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  companyId: string;
  branchId?: string;
  email: string;
  roleId?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Common Query Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
}

// Stock Movement Types
export type StockMovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';
export type StockReferenceType = 'SALE' | 'PURCHASE' | 'TRANSFER' | 'POS_ORDER' | 'ADJUSTMENT';

// Payment Status Types
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type SaleStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';
export type InvoiceStatus = 'PENDING' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

