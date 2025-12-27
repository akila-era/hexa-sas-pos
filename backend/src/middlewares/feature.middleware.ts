import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from './error.middleware';
import { prisma } from '../database/client';

/**
 * Feature Guard Middleware
 * 
 * Checks if a specific feature is enabled for the tenant.
 * Blocks access to routes if the feature is disabled.
 * 
 * This middleware MUST be used after authenticate and tenantIsolation middleware.
 * 
 * @param featureKey - The feature key to check (e.g., 'OMS')
 * 
 * Usage: router.use(authenticate, tenantIsolation, featureGuard('OMS'))
 */
export const featureGuard = (featureKey: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const tenantId = req.companyId || req.tenantId;

      if (!tenantId) {
        throw new AppError(
          'Tenant context is required. Ensure authenticate and tenantIsolation middleware are applied first.',
          403,
          'TENANT_CONTEXT_REQUIRED'
        );
      }

      // Check if feature is enabled for this tenant
      const feature = await prisma.tenantFeature.findUnique({
        where: {
          tenantId_featureKey: {
            tenantId,
            featureKey,
          },
        },
      });

      // If feature doesn't exist or is disabled, block access
      if (!feature || !feature.isEnabled) {
        throw new AppError(
          `The ${featureKey} module is not enabled for your account. Please contact your administrator.`,
          403,
          'FEATURE_DISABLED'
        );
      }

      // Feature is enabled, proceed
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional Feature Check Middleware
 * 
 * Checks if a feature is enabled and attaches the status to the request.
 * Does NOT block access, but provides information for conditional logic.
 * 
 * @param featureKey - The feature key to check
 * 
 * Usage: router.use(optionalFeatureCheck('OMS'))
 */
export const optionalFeatureCheck = (featureKey: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const tenantId = req.companyId || req.tenantId;

      if (tenantId) {
        const feature = await prisma.tenantFeature.findUnique({
          where: {
            tenantId_featureKey: {
              tenantId,
              featureKey,
            },
          },
        });

        // Attach feature status to request
        (req as any).featureEnabled = feature?.isEnabled || false;
      }

      next();
    } catch (error) {
      // Don't block on error, just continue
      (req as any).featureEnabled = false;
      next();
    }
  };
};

export default featureGuard;

