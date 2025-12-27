import apiClient from '../utils/api';

export const incomeService = {
  // Get all incomes
  getAll: async (params = {}) => {
    return await apiClient.get('/income', { params });
  },

  // Get income summary
  getSummary: async (startDate, endDate) => {
    return await apiClient.get('/income/summary', {
      params: { startDate, endDate },
    });
  },

  // Get incomes by category
  getByCategory: async (startDate, endDate) => {
    return await apiClient.get('/income/by-category', {
      params: { startDate, endDate },
    });
  },

  // Get income by ID
  getById: async (id) => {
    return await apiClient.get(`/income/${id}`);
  },

  // Create new income
  create: async (data) => {
    return await apiClient.post('/income', data);
  },

  // Update income
  update: async (id, data) => {
    return await apiClient.put(`/income/${id}`, data);
  },

  // Delete income
  delete: async (id) => {
    return await apiClient.delete(`/income/${id}`);
  },

  // Categories
  getCategories: async () => {
    return await apiClient.get('/income/categories/list');
  },

  createCategory: async (data) => {
    return await apiClient.post('/income/categories', data);
  },

  updateCategory: async (id, data) => {
    return await apiClient.put(`/income/categories/${id}`, data);
  },

  deleteCategory: async (id) => {
    return await apiClient.delete(`/income/categories/${id}`);
  },
};

