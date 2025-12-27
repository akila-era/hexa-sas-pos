import apiClient from '../utils/api';

export const leaveTypeService = {
  // Get all leave types
  getAll: async (params = {}) => {
    return await apiClient.get('/leave-types', { params });
  },

  // Get leave type by ID
  getById: async (id) => {
    return await apiClient.get(`/leave-types/${id}`);
  },

  // Create new leave type
  create: async (data) => {
    return await apiClient.post('/leave-types', data);
  },

  // Update leave type
  update: async (id, data) => {
    return await apiClient.put(`/leave-types/${id}`, data);
  },

  // Delete leave type
  delete: async (id) => {
    return await apiClient.delete(`/leave-types/${id}`);
  },
};

