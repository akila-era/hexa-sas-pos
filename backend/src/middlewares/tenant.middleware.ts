import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError as AppErrorClass } from './error.middleware';

/**
 * Tenant Isolation Middleware
 * 
 * Enforces tenant isolation by ensuring all operations are scoped to the tenant_id
 * extracted from the JWT token. This prevents cross-tenant data access.
 * 
 * This middleware MUST be used after the authenticate middleware.
 * 
 * Usage: router.use(tenantIsolation)
 */
export const tenantIsolation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure tenant_id (companyId) is available from token
    if (!req.companyId) {
      throw new AppErrorClass(
        'Tenant context is required. Ensure authenticate middleware is applied first.',
        403,
        'TENANT_CONTEXT_REQUIRED'
      );
    }

    // For GET/DELETE requests, ensure tenant_id is available for filtering
    // Services should use req.companyId to filter queries
    if (req.method === 'GET' || req.method === 'DELETE') {
      // Tenant ID is already set from token in authenticate middleware
      // Services should use req.companyId for all database queries
    } else {
      // For POST/PUT/PATCH requests, enforce tenant_id in request body
      if (req.body && typeof req.body === 'object') {
        // Prevent client from overriding tenant_id
        if (req.body.companyId && req.body.companyId !== req.companyId) {
          throw new AppErrorClass(
            'Cannot modify tenant_id. Access denied.',
            403,
            'TENANT_ID_MODIFICATION_DENIED'
          );
        }
        // Always set tenant_id from token (not from user object, but from token)
        req.body.companyId = req.companyId;
      }
    }

    // Handle branch context if user has a branch
    if (req.branchId && req.method !== 'GET') {
      // For write operations, default to user's branch if not specified
      if (req.body && typeof req.body === 'object' && !req.body.branchId) {
        req.body.branchId = req.branchId;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Alias for tenantIsolation for backward compatibility
 * @deprecated Use tenantIsolation instead
 */
export const tenantSafe = tenantIsolation;

/**
 * Alias for tenantIsolation for backward compatibility
 * @deprecated Use tenantIsolation instead
 */
export const tenantMiddleware = tenantIsolation;

/**
 * Middleware to validate branch access
 * Ensures user can only access data from their assigned branch (if they have one)
 */
export const branchAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userBranchId = req.user?.branchId;

  // If user has a branch, enforce branch-level access
  if (userBranchId) {
    // For query params, add branch filter
    if (req.method === 'GET') {
      req.query.branchId = userBranchId.toString();
    }

    // For body params, ensure branch matches user's branch
    if (req.body && typeof req.body === 'object') {
      if (req.body.branchId && req.body.branchId !== userBranchId) {
        throw new AppErrorClass(
          'Access denied: Branch mismatch',
          403,
          'BRANCH_ACCESS_DENIED'
        );
      }
      req.body.branchId = userBranchId;
    }

    req.branchId = userBranchId;
  }

  next();
};

