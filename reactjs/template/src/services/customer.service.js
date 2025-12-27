import apiClient from '../utils/api';

export const customerService = {
  // Get all customers
  getAll: async (params = {}) => {
    return await apiClient.get('/customers', { params });
  },

  // Get customer by ID
  getById: async (id) => {
    return await apiClient.get(`/customers/${id}`);
  },

  // Get customer balance
  getBalance: async (id) => {
    return await apiClient.get(`/customers/${id}/balance`);
  },

  // Get customer sales history
  getSalesHistory: async (id, params = {}) => {
    return await apiClient.get(`/customers/${id}/sales`, { params });
  },

  // Create new customer
  create: async (data) => {
    return await apiClient.post('/customers', data);
  },

  // Update customer
  update: async (id, data) => {
    return await apiClient.put(`/customers/${id}`, data);
  },

  // Delete customer
  delete: async (id) => {
    return await apiClient.delete(`/customers/${id}`);
  },
};

