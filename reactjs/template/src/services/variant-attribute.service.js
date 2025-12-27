import apiClient from '../utils/api';

export const variantAttributeService = {
  // Get all variant attributes with filters
  getAll: async (params = {}) => {
    return await apiClient.get('/variant-attributes', { params });
  },

  // Get variant attribute by ID
  getById: async (id) => {
    return await apiClient.get(`/variant-attributes/${id}`);
  },

  // Create new variant attribute
  create: async (data) => {
    // Transform frontend field names to backend format
    const backendData = {
      name: data.variant,
      values: data.values,
      isActive: data.status === 'Active' || data.isActive === true,
    };
    return await apiClient.post('/variant-attributes', backendData);
  },

  // Update variant attribute
  update: async (id, data) => {
    // Transform frontend field names to backend format
    const backendData = {};
    if (data.variant !== undefined) backendData.name = data.variant;
    if (data.values !== undefined) backendData.values = data.values;
    if (data.status !== undefined) backendData.isActive = data.status === 'Active';
    if (data.isActive !== undefined) backendData.isActive = data.isActive;
    
    return await apiClient.put(`/variant-attributes/${id}`, backendData);
  },

  // Delete variant attribute
  delete: async (id) => {
    return await apiClient.delete(`/variant-attributes/${id}`);
  },
};

