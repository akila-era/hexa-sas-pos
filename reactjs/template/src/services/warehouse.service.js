import apiClient from '../utils/api';

export const warehouseService = {
  // Get all warehouses
  getAll: async (params = {}) => {
    return await apiClient.get('/warehouses', { params });
  },

  // Get warehouse by ID
  getById: async (id) => {
    return await apiClient.get(`/warehouses/${id}`);
  },

  // Create new warehouse
  create: async (data) => {
    return await apiClient.post('/warehouses', data);
  },

  // Update warehouse
  update: async (id, data) => {
    return await apiClient.put(`/warehouses/${id}`, data);
  },

  // Delete warehouse
  delete: async (id) => {
    return await apiClient.delete(`/warehouses/${id}`);
  },

  // Get warehouses by branch
  getByBranch: async (branchId) => {
    return await apiClient.get(`/warehouses/branch/${branchId}`);
  },
};

