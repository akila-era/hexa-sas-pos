import apiClient from '../utils/api';

export const expenseService = {
  // Get all expenses
  getAll: async (params = {}) => {
    return await apiClient.get('/expenses', { params });
  },

  // Get expense summary
  getSummary: async (startDate, endDate) => {
    return await apiClient.get('/expenses/summary', {
      params: { startDate, endDate },
    });
  },

  // Get expenses by category
  getByCategory: async (startDate, endDate) => {
    return await apiClient.get('/expenses/by-category', {
      params: { startDate, endDate },
    });
  },

  // Get expense by ID
  getById: async (id) => {
    return await apiClient.get(`/expenses/${id}`);
  },

  // Create new expense
  create: async (data) => {
    return await apiClient.post('/expenses', data);
  },

  // Update expense
  update: async (id, data) => {
    return await apiClient.put(`/expenses/${id}`, data);
  },

  // Delete expense
  delete: async (id) => {
    return await apiClient.delete(`/expenses/${id}`);
  },

  // Categories
  getCategories: async () => {
    return await apiClient.get('/expenses/categories/list');
  },

  createCategory: async (data) => {
    return await apiClient.post('/expenses/categories', data);
  },

  updateCategory: async (id, data) => {
    return await apiClient.put(`/expenses/categories/${id}`, data);
  },

  deleteCategory: async (id) => {
    return await apiClient.delete(`/expenses/categories/${id}`);
  },
};

