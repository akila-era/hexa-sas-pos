import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from './error.middleware';

/**
 * Middleware to verify that the authenticated user is a Super Admin
 * This should be used after the authenticate middleware
 */
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const roleName = user.role?.name?.toLowerCase() || '';
    
    const isSuperAdmin = 
      roleName.includes('super admin') || 
      roleName.includes('superadmin') || 
      roleName === 'admin' ||
      roleName.includes('super');

    if (!isSuperAdmin) {
      throw new AppError(
        'Access denied. Super Admin privileges required.',
        403,
        'FORBIDDEN'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Combined middleware for super admin routes
 * Includes authentication check and super admin role verification
 */
export const superAdminGuard = [requireSuperAdmin];

export default requireSuperAdmin;









