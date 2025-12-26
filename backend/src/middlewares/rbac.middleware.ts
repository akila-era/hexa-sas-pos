import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError as AppErrorClass } from './error.middleware';

/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * This middleware provides various functions to check user permissions and roles.
 * All RBAC middleware requires the authenticate middleware to be applied first.
 */

/**
 * Check if user has a specific permission
 * 
 * @param permissionSlug - The permission slug to check (e.g., 'products:create')
 * 
 * Usage: router.post('/', requirePermission('products:create'), controller.create)
 */
export const requirePermission = (permissionSlug: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppErrorClass(
          'Authentication required. Ensure authenticate middleware is applied first.',
          401,
          'UNAUTHORIZED'
        );
      }

      const role = req.user.role;

      if (!role) {
        throw new AppErrorClass(
          'Access denied: No role assigned to user',
          403,
          'NO_ROLE'
        );
      }

      // Check if role has the required permission
      const hasPermission = role.permissions?.some(
        (rp) => rp.permission.key === permissionSlug
      );

      if (!hasPermission) {
        throw new AppErrorClass(
          `Access denied: Missing required permission '${permissionSlug}'`,
          403,
          'PERMISSION_DENIED'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has any of the specified permissions (OR logic)
 * 
 * @param permissionSlugs - Array of permission slugs to check
 * 
 * Usage: router.post('/', requireAnyPermission(['products:create', 'products:update']), controller.create)
 */
export const requireAnyPermission = (permissionSlugs: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppErrorClass(
          'Authentication required. Ensure authenticate middleware is applied first.',
          401,
          'UNAUTHORIZED'
        );
      }

      const role = req.user.role;

      if (!role) {
        throw new AppErrorClass(
          'Access denied: No role assigned to user',
          403,
          'NO_ROLE'
        );
      }

      const hasPermission = permissionSlugs.some((slug) =>
        role.permissions?.some((rp) => rp.permission.key === slug)
      );

      if (!hasPermission) {
        throw new AppErrorClass(
          `Access denied: Missing required permissions. Required: ${permissionSlugs.join(', ')}`,
          403,
          'PERMISSION_DENIED'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has all of the specified permissions (AND logic)
 * 
 * @param permissionSlugs - Array of permission slugs to check
 * 
 * Usage: router.post('/', requireAllPermissions(['products:create', 'products:update']), controller.create)
 */
export const requireAllPermissions = (permissionSlugs: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppErrorClass(
          'Authentication required. Ensure authenticate middleware is applied first.',
          401,
          'UNAUTHORIZED'
        );
      }

      const role = req.user.role;

      if (!role) {
        throw new AppErrorClass(
          'Access denied: No role assigned to user',
          403,
          'NO_ROLE'
        );
      }

      const hasAllPermissions = permissionSlugs.every((slug) =>
        role.permissions?.some((rp) => rp.permission.key === slug)
      );

      if (!hasAllPermissions) {
        const missingPermissions = permissionSlugs.filter(
          (slug) => !role.permissions?.some((rp) => rp.permission.key === slug)
        );
        throw new AppErrorClass(
          `Access denied: Missing required permissions: ${missingPermissions.join(', ')}`,
          403,
          'PERMISSION_DENIED'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user belongs to a specific role
 * 
 * @param roleSlug - The role slug to check (e.g., 'admin', 'manager')
 * 
 * Usage: router.delete('/', requireRole('admin'), controller.delete)
 */
export const requireRole = (roleSlug: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppErrorClass(
          'Authentication required. Ensure authenticate middleware is applied first.',
          401,
          'UNAUTHORIZED'
        );
      }

      const role = req.user.role;

      if (!role) {
        throw new AppErrorClass(
          'Access denied: No role assigned to user',
          403,
          'NO_ROLE'
        );
      }

      if (role.name !== roleSlug) {
        throw new AppErrorClass(
          `Access denied: Required role '${roleSlug}', but user has role '${role.name}'`,
          403,
          'ROLE_DENIED'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user belongs to any of the specified roles (OR logic)
 * 
 * @param roleSlugs - Array of role slugs to check
 * 
 * Usage: router.get('/', requireAnyRole(['admin', 'manager']), controller.list)
 */
export const requireAnyRole = (roleSlugs: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppErrorClass(
          'Authentication required. Ensure authenticate middleware is applied first.',
          401,
          'UNAUTHORIZED'
        );
      }

      const role = req.user.role;

      if (!role) {
        throw new AppErrorClass(
          'Access denied: No role assigned to user',
          403,
          'NO_ROLE'
        );
      }

      const hasRole = roleSlugs.includes(role.name);

      if (!hasRole) {
        throw new AppErrorClass(
          `Access denied: Required one of roles: ${roleSlugs.join(', ')}, but user has role '${role.name}'`,
          403,
          'ROLE_DENIED'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

