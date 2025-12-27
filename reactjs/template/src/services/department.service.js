import apiClient from '../utils/api';

export const departmentService = {
  // Get all departments
  getAll: async (params = {}) => {
    return await apiClient.get('/departments', { params });
  },

  // Get department by ID
  getById: async (id) => {
    return await apiClient.get(`/departments/${id}`);
  },

  // Create new department
  create: async (data) => {
    return await apiClient.post('/departments', data);
  },

  // Update department
  update: async (id, data) => {
    return await apiClient.put(`/departments/${id}`, data);
  },

  // Delete department
  delete: async (id) => {
    return await apiClient.delete(`/departments/${id}`);
  },
};

