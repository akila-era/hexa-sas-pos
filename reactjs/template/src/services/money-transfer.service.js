import apiClient from '../utils/api';

export const moneyTransferService = {
  // Get all money transfers
  getAll: async (params = {}) => {
    return await apiClient.get('/money-transfer', { params });
  },

  // Get money transfer by ID
  getById: async (id) => {
    return await apiClient.get(`/money-transfer/${id}`);
  },

  // Create new money transfer
  create: async (data) => {
    return await apiClient.post('/money-transfer', data);
  },

  // Delete money transfer
  delete: async (id) => {
    return await apiClient.delete(`/money-transfer/${id}`);
  },
};

