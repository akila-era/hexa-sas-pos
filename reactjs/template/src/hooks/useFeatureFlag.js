import { useState, useEffect } from 'react';
import { featureToggleService } from '../services/feature-toggle.service';

/**
 * Hook to check if a feature is enabled for the current tenant
 * @param {string} featureKey - The feature key to check (e.g., 'OMS')
 * @param {string} tenantId - The tenant ID (optional, will try to get from localStorage)
 * @returns {object} { isEnabled, loading, error }
 */
export const useFeatureFlag = (featureKey, tenantId = null) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get tenant ID from localStorage if not provided
        const currentTenantId = tenantId || JSON.parse(localStorage.getItem('user') || '{}')?.tenantId;

        if (!currentTenantId) {
          setIsEnabled(false);
          setLoading(false);
          return;
        }

        // Check if feature is enabled
        const response = await featureToggleService.getTenantFeatures(currentTenantId);
        
        if (response.success && response.data) {
          const feature = response.data.features.find(
            (f) => f.featureKey === featureKey
          );
          setIsEnabled(feature?.isEnabled || false);
        } else {
          setIsEnabled(false);
        }
      } catch (err) {
        console.error(`Error checking feature ${featureKey}:`, err);
        setError(err);
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeature();
  }, [featureKey, tenantId]);

  return { isEnabled, loading, error };
};

/**
 * Hook specifically for OMS feature
 */
export const useOMSEnabled = (tenantId = null) => {
  return useFeatureFlag('OMS', tenantId);
};

export default useFeatureFlag;

