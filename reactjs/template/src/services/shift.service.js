import apiClient from '../utils/api';

export const shiftService = {
  // Get all shifts
  getAll: async (params = {}) => {
    return await apiClient.get('/shifts', { params });
  },

  // Get shift by ID
  getById: async (id) => {
    return await apiClient.get(`/shifts/${id}`);
  },

  // Create new shift
  create: async (data) => {
    return await apiClient.post('/shifts', data);
  },

  // Update shift
  update: async (id, data) => {
    return await apiClient.put(`/shifts/${id}`, data);
  },

  // Delete shift
  delete: async (id) => {
    return await apiClient.delete(`/shifts/${id}`);
  },
};

