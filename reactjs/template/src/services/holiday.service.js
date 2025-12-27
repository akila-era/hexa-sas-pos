import apiClient from '../utils/api';

export const holidayService = {
  // Get all holidays
  getAll: async (params = {}) => {
    return await apiClient.get('/holidays', { params });
  },

  // Get holiday by ID
  getById: async (id) => {
    return await apiClient.get(`/holidays/${id}`);
  },

  // Create new holiday
  create: async (data) => {
    return await apiClient.post('/holidays', data);
  },

  // Update holiday
  update: async (id, data) => {
    return await apiClient.put(`/holidays/${id}`, data);
  },

  // Delete holiday
  delete: async (id) => {
    return await apiClient.delete(`/holidays/${id}`);
  },
};

