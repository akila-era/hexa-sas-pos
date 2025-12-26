import apiClient from '../utils/api';

export const posService = {
  // Create POS order
  createOrder: async (data) => {
    return await apiClient.post('/pos/orders', data);
  },

  // Get all POS orders
  getAll: async (params = {}) => {
    return await apiClient.get('/pos/orders', { params });
  },

  // Get POS order by ID
  getById: async (id) => {
    return await apiClient.get(`/pos/orders/${id}`);
  },
};







