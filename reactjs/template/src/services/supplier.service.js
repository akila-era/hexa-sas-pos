import apiClient from '../utils/api';

export const supplierService = {
  // Get all suppliers
  getAll: async (params = {}) => {
    return await apiClient.get('/suppliers', { params });
  },

  // Get supplier by ID
  getById: async (id) => {
    return await apiClient.get(`/suppliers/${id}`);
  },

  // Get supplier balance
  getBalance: async (id) => {
    return await apiClient.get(`/suppliers/${id}/balance`);
  },

  // Create new supplier
  create: async (data) => {
    return await apiClient.post('/suppliers', data);
  },

  // Update supplier
  update: async (id, data) => {
    return await apiClient.put(`/suppliers/${id}`, data);
  },

  // Delete supplier
  delete: async (id) => {
    return await apiClient.delete(`/suppliers/${id}`);
  },
};

