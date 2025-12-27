import apiClient from '../utils/api';

export const designationService = {
  // Get all designations
  getAll: async (params = {}) => {
    return await apiClient.get('/designations', { params });
  },

  // Get designation by ID
  getById: async (id) => {
    return await apiClient.get(`/designations/${id}`);
  },

  // Create new designation
  create: async (data) => {
    return await apiClient.post('/designations', data);
  },

  // Update designation
  update: async (id, data) => {
    return await apiClient.put(`/designations/${id}`, data);
  },

  // Delete designation
  delete: async (id) => {
    return await apiClient.delete(`/designations/${id}`);
  },
};

