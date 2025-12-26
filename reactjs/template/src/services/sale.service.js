import apiClient from '../utils/api';

export const saleService = {
  // Get all sales
  getAll: async (params = {}) => {
    return await apiClient.get('/sales', { params });
  },

  // Get sale by ID
  getById: async (id) => {
    return await apiClient.get(`/sales/${id}`);
  },

  // Create new sale
  create: async (data) => {
    return await apiClient.post('/sales', data);
  },
};







