import apiClient from '../utils/api';

export const categoryService = {
  // Get all categories with filters
  getAll: async (params = {}) => {
    return await apiClient.get('/categories', { params });
  },

  // Get category tree (hierarchical)
  getTree: async () => {
    return await apiClient.get('/categories/tree');
  },

  // Get category by ID
  getById: async (id) => {
    return await apiClient.get(`/categories/${id}`);
  },

  // Create new category
  create: async (data) => {
    return await apiClient.post('/categories', data);
  },

  // Update category
  update: async (id, data) => {
    return await apiClient.put(`/categories/${id}`, data);
  },

  // Delete category
  delete: async (id) => {
    return await apiClient.delete(`/categories/${id}`);
  },
};

