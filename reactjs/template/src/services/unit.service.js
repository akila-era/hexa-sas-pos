import apiClient from '../utils/api';

export const unitService = {
  // Get all units
  getAll: async (params = {}) => {
    return await apiClient.get('/units', { params });
  },

  // Get unit by ID
  getById: async (id) => {
    return await apiClient.get(`/units/${id}`);
  },

  // Create new unit
  create: async (data) => {
    return await apiClient.post('/units', data);
  },

  // Update unit
  update: async (id, data) => {
    return await apiClient.put(`/units/${id}`, data);
  },

  // Delete unit
  delete: async (id) => {
    return await apiClient.delete(`/units/${id}`);
  },
};

