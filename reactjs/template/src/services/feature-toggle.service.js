import apiClient from '../utils/api';

export const featureToggleService = {
  // Get all tenants with their enabled features (Super Admin only)
  getAllTenantsWithFeatures: async () => {
    return await apiClient.get('/super-admin/features/tenants');
  },

  // Get enabled features for a specific tenant (Super Admin only)
  getTenantFeatures: async (tenantId) => {
    return await apiClient.get(`/super-admin/features/tenants/${tenantId}`);
  },

  // Enable a feature for a tenant (Super Admin only)
  enableFeature: async (tenantId, featureKey) => {
    return await apiClient.post('/super-admin/features/enable', {
      tenantId,
      featureKey,
    });
  },

  // Disable a feature for a tenant (Super Admin only)
  disableFeature: async (tenantId, featureKey) => {
    return await apiClient.post('/super-admin/features/disable', {
      tenantId,
      featureKey,
    });
  },

  // Toggle a feature for a tenant (Super Admin only)
  toggleFeature: async (tenantId, featureKey) => {
    return await apiClient.post('/super-admin/features/toggle', {
      tenantId,
      featureKey,
    });
  },

  // Get all available features (Super Admin only)
  getAvailableFeatures: async () => {
    return await apiClient.get('/super-admin/features/available');
  },

  // Check if OMS is enabled for current tenant (for frontend conditional rendering)
  checkOMSEnabled: async (tenantId) => {
    try {
      const response = await featureToggleService.getTenantFeatures(tenantId);
      if (response.success && response.data) {
        const omsFeature = response.data.features.find(
          (f) => f.featureKey === 'OMS'
        );
        return omsFeature?.isEnabled || false;
      }
      return false;
    } catch (error) {
      console.error('Error checking OMS feature:', error);
      return false;
    }
  },
};

