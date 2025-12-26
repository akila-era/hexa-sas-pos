import apiClient from '../utils/api';

export const productService = {
  // Get all products with filters
  getAll: async (params = {}) => {
    return await apiClient.get('/products', { params });
  },

  // Get product by ID
  getById: async (id) => {
    return await apiClient.get(`/products/${id}`);
  },

  // Create new product
  create: async (data) => {
    return await apiClient.post('/products', data);
  },

  // Update product
  update: async (id, data) => {
    return await apiClient.put(`/products/${id}`, data);
  },

  // Delete product
  delete: async (id) => {
    return await apiClient.delete(`/products/${id}`);
  },
};







