import { prisma } from '../../database/client';
import { AppError } from '../../middlewares/error.middleware';
import { z } from 'zod';

// Validation schemas
export const featureToggleSchema = z.object({
  tenantId: z.string().uuid(),
  featureKey: z.string().min(1),
  isEnabled: z.boolean(),
});

export const featureFilterSchema = z.object({
  tenantId: z.string().uuid().optional(),
  featureKey: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

export class FeatureToggleService {
  /**
   * Get all tenants with their enabled features
   */
  async getAllTenantsWithFeatures() {
    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
      },
      include: {
        tenantFeatures: {
          orderBy: {
            featureKey: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      plan: tenant.plan,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      features: tenant.tenantFeatures.map((feature) => ({
        featureKey: feature.featureKey,
        isEnabled: feature.isEnabled,
        enabledAt: feature.enabledAt,
        enabledBy: feature.enabledBy,
        disabledAt: feature.disabledAt,
        disabledBy: feature.disabledBy,
      })),
    }));
  }

  /**
   * Get enabled features for a specific tenant
   */
  async getTenantFeatures(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        tenantFeatures: {
          orderBy: {
            featureKey: 'asc',
          },
        },
      },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
    }

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      features: tenant.tenantFeatures.map((feature) => ({
        featureKey: feature.featureKey,
        isEnabled: feature.isEnabled,
        enabledAt: feature.enabledAt,
        enabledBy: feature.enabledBy,
        disabledAt: feature.disabledAt,
        disabledBy: feature.disabledBy,
      })),
    };
  }

  /**
   * Enable a feature for a tenant
   */
  async enableFeature(tenantId: string, featureKey: string, enabledBy: string) {
    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
    }

    // Check if feature already exists
    const existingFeature = await prisma.tenantFeature.findUnique({
      where: {
        tenantId_featureKey: {
          tenantId,
          featureKey,
        },
      },
    });

    if (existingFeature && existingFeature.isEnabled) {
      throw new AppError(
        `Feature ${featureKey} is already enabled for this tenant`,
        400,
        'FEATURE_ALREADY_ENABLED'
      );
    }

    // Upsert feature (create or update)
    const feature = await prisma.tenantFeature.upsert({
      where: {
        tenantId_featureKey: {
          tenantId,
          featureKey,
        },
      },
      create: {
        tenantId,
        featureKey,
        isEnabled: true,
        enabledAt: new Date(),
        enabledBy,
      },
      update: {
        isEnabled: true,
        enabledAt: new Date(),
        enabledBy,
        disabledAt: null,
        disabledBy: null,
      },
    });

    // Log the action (you can extend this to use a logging service)
    console.log(`[FEATURE_TOGGLE] Feature ${featureKey} enabled for tenant ${tenantId} by ${enabledBy}`);

    return feature;
  }

  /**
   * Disable a feature for a tenant
   */
  async disableFeature(tenantId: string, featureKey: string, disabledBy: string) {
    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
    }

    // Check if feature exists
    const existingFeature = await prisma.tenantFeature.findUnique({
      where: {
        tenantId_featureKey: {
          tenantId,
          featureKey,
        },
      },
    });

    if (!existingFeature) {
      throw new AppError(
        `Feature ${featureKey} is not configured for this tenant`,
        404,
        'FEATURE_NOT_FOUND'
      );
    }

    if (!existingFeature.isEnabled) {
      throw new AppError(
        `Feature ${featureKey} is already disabled for this tenant`,
        400,
        'FEATURE_ALREADY_DISABLED'
      );
    }

    // Update feature
    const feature = await prisma.tenantFeature.update({
      where: {
        tenantId_featureKey: {
          tenantId,
          featureKey,
        },
      },
      data: {
        isEnabled: false,
        disabledAt: new Date(),
        disabledBy,
        enabledAt: null,
        enabledBy: null,
      },
    });

    // Log the action
    console.log(`[FEATURE_TOGGLE] Feature ${featureKey} disabled for tenant ${tenantId} by ${disabledBy}`);

    return feature;
  }

  /**
   * Toggle feature (enable if disabled, disable if enabled)
   */
  async toggleFeature(tenantId: string, featureKey: string, userId: string) {
    const existingFeature = await prisma.tenantFeature.findUnique({
      where: {
        tenantId_featureKey: {
          tenantId,
          featureKey,
        },
      },
    });

    if (existingFeature && existingFeature.isEnabled) {
      return this.disableFeature(tenantId, featureKey, userId);
    } else {
      return this.enableFeature(tenantId, featureKey, userId);
    }
  }

  /**
   * Get all available features (for reference)
   */
  async getAvailableFeatures() {
    // Get all unique feature keys from the database
    const features = await prisma.tenantFeature.findMany({
      select: {
        featureKey: true,
      },
      distinct: ['featureKey'],
      orderBy: {
        featureKey: 'asc',
      },
    });

    // Define known features (you can extend this)
    const knownFeatures = [
      { key: 'OMS', name: 'Order Management System', description: 'Full order management with delivery tracking' },
      // Add more features as they are implemented
    ];

    return knownFeatures.map((known) => ({
      ...known,
      isUsed: features.some((f) => f.featureKey === known.key),
    }));
  }
}

export default new FeatureToggleService();

