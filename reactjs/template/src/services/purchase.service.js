import apiClient from '../utils/api';

export const purchaseService = {
  // Get all purchases
  getAll: async (params = {}) => {
    return await apiClient.get('/purchases', { params });
  },

  // Get purchase by ID
  getById: async (id) => {
    return await apiClient.get(`/purchases/${id}`);
  },

  // Create new purchase
  create: async (data) => {
    return await apiClient.post('/purchases', data);
  },

  // Add payment to purchase
  addPayment: async (id, data) => {
    return await apiClient.post(`/purchases/${id}/payment`, data);
  },

  // Update purchase
  update: async (id, data) => {
    return await apiClient.put(`/purchases/${id}`, data);
  },

  // Delete purchase
  delete: async (id) => {
    return await apiClient.delete(`/purchases/${id}`);
  },
};

