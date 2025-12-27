import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../../types';
import featureToggleService from '../../services/superadmin/feature-toggle.service';
import { errorHandler } from '../../middlewares/error.middleware';

export class FeatureToggleController {
  /**
   * Get all tenants with their enabled features
   * GET /api/v1/super-admin/features/tenants
   */
  async getAllTenantsWithFeatures(req: AuthRequest, res: Response) {
    try {
      const tenants = await featureToggleService.getAllTenantsWithFeatures();

      const response: ApiResponse = {
        success: true,
        data: tenants,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get enabled features for a specific tenant
   * GET /api/v1/super-admin/features/tenants/:tenantId
   */
  async getTenantFeatures(req: AuthRequest, res: Response) {
    try {
      const features = await featureToggleService.getTenantFeatures(req.params.tenantId);

      const response: ApiResponse = {
        success: true,
        data: features,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Enable a feature for a tenant
   * POST /api/v1/super-admin/features/enable
   */
  async enableFeature(req: AuthRequest, res: Response) {
    try {
      const { tenantId, featureKey } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      if (!tenantId || !featureKey) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'tenantId and featureKey are required' },
        });
      }

      const feature = await featureToggleService.enableFeature(tenantId, featureKey, userId);

      const response: ApiResponse = {
        success: true,
        data: feature,
        message: `Feature ${featureKey} enabled successfully for tenant`,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Disable a feature for a tenant
   * POST /api/v1/super-admin/features/disable
   */
  async disableFeature(req: AuthRequest, res: Response) {
    try {
      const { tenantId, featureKey } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      if (!tenantId || !featureKey) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'tenantId and featureKey are required' },
        });
      }

      const feature = await featureToggleService.disableFeature(tenantId, featureKey, userId);

      const response: ApiResponse = {
        success: true,
        data: feature,
        message: `Feature ${featureKey} disabled successfully for tenant`,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Toggle a feature for a tenant
   * POST /api/v1/super-admin/features/toggle
   */
  async toggleFeature(req: AuthRequest, res: Response) {
    try {
      const { tenantId, featureKey } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      if (!tenantId || !featureKey) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'tenantId and featureKey are required' },
        });
      }

      const feature = await featureToggleService.toggleFeature(tenantId, featureKey, userId);

      const response: ApiResponse = {
        success: true,
        data: feature,
        message: `Feature ${featureKey} ${feature.isEnabled ? 'enabled' : 'disabled'} successfully`,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get all available features
   * GET /api/v1/super-admin/features/available
   */
  async getAvailableFeatures(req: AuthRequest, res: Response) {
    try {
      const features = await featureToggleService.getAvailableFeatures();

      const response: ApiResponse = {
        success: true,
        data: features,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}

export default new FeatureToggleController();

