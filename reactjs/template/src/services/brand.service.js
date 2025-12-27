import apiClient from '../utils/api';

export const brandService = {
  // Get all brands
  getAll: async (params = {}) => {
    return await apiClient.get('/brands', { params });
  },

  // Get brand by ID
  getById: async (id) => {
    return await apiClient.get(`/brands/${id}`);
  },

  // Create new brand
  create: async (data) => {
    return await apiClient.post('/brands', data);
  },

  // Update brand
  update: async (id, data) => {
    return await apiClient.put(`/brands/${id}`, data);
  },

  // Delete brand
  delete: async (id) => {
    return await apiClient.delete(`/brands/${id}`);
  },
};

