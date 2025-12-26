import apiClient from '../utils/api';

export const reportService = {
  // Get sales summary
  getSalesSummary: async (params = {}) => {
    return await apiClient.get('/reports/sales/summary', { params });
  },

  // Get top products
  getTopProducts: async (params = {}) => {
    return await apiClient.get('/reports/sales/top-products', { params });
  },

  // Get daily sales
  getDailySales: async (params = {}) => {
    return await apiClient.get('/reports/sales/daily', { params });
  },

  // Get inventory summary
  getInventorySummary: async (params = {}) => {
    return await apiClient.get('/reports/inventory/summary', { params });
  },
};







