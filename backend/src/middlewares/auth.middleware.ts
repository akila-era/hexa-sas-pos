import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../database/client';
import { AuthRequest, JwtPayload } from '../types';
import { AppError as AppErrorClass } from './error.middleware';

/**
 * JWT Authentication Middleware
 * 
 * Extracts and verifies JWT token from Authorization header.
 * Extracts tenant_id (companyId) from token payload.
 * Fetches user data and attaches to request object.
 * 
 * Usage: router.use(authenticate)
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppErrorClass('Authentication required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode JWT token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppErrorClass('Token has expired', 401, 'TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppErrorClass('Invalid token', 401, 'INVALID_TOKEN');
      }
      throw new AppErrorClass('Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED');
    }

    // Extract tenant_id (companyId) from token
    if (!decoded.companyId) {
      throw new AppErrorClass('Invalid token: missing companyId', 401, 'INVALID_TOKEN_PAYLOAD');
    }

    // Fetch user with related data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenant: true,
        branch: true,
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppErrorClass('User not found', 404, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppErrorClass('User account is inactive', 403, 'ACCOUNT_INACTIVE');
    }

    // Check if user is Super Admin
    // Trim whitespace and convert to lowercase for consistent checking
    const roleName = (user.role?.name || '').trim().toLowerCase();
    const isSuperAdmin = 
      roleName.includes('super admin') || 
      roleName.includes('superadmin') ||
      roleName === 'admin' ||
      roleName.includes('super') ||
      roleName.startsWith('super') ||
      roleName.endsWith('admin');

    // Check if tenant is active (skip for Super Admin - they can access even if tenant is inactive)
    if (!isSuperAdmin && !user.tenant?.isActive) {
      throw new AppErrorClass('Tenant account is inactive', 403, 'TENANT_INACTIVE');
    }

    // Verify token companyId matches user's tenantId (security check)
    if (user.tenantId !== decoded.companyId) {
      throw new AppErrorClass('Token tenantId mismatch', 403, 'TENANT_MISMATCH');
    }

    // Attach user and tenant information to request
    req.user = user as any;
    req.companyId = decoded.companyId; // Keep companyId name for backward compatibility (maps to tenantId)
    req.branchId = decoded.branchId || user.branchId || undefined;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Authentication Middleware
 * 
 * Similar to authenticate, but doesn't throw errors if no token is provided.
 * Useful for routes that work both with and without authentication.
 * 
 * Usage: router.use(optionalAuth)
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

        // Extract tenant_id from token if available
        if (decoded.companyId) {
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
              tenant: true,
              branch: true,
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          });

          if (user && user.isActive && user.tenant?.isActive) {
            // Verify token companyId matches user's tenantId
            if (user.tenantId === decoded.companyId) {
              req.user = user as any;
              req.companyId = decoded.companyId; // Keep companyId name for backward compatibility
              req.branchId = decoded.branchId || user.branchId || undefined;
            }
          }
        }
      } catch (error) {
        // Silently fail for optional auth - token is invalid or expired
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

