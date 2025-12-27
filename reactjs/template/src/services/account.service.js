import apiClient from '../utils/api';

export const accountService = {
  // Get all accounts
  getAll: async (params = {}) => {
    return await apiClient.get('/accounts', { params });
  },

  // Get chart of accounts
  getChartOfAccounts: async () => {
    return await apiClient.get('/accounts/chart');
  },

  // Get account by ID
  getById: async (id) => {
    return await apiClient.get(`/accounts/${id}`);
  },

  // Get account statement
  getStatement: async (id, startDate, endDate) => {
    return await apiClient.get(`/accounts/${id}/statement`, {
      params: { startDate, endDate },
    });
  },

  // Create new account
  create: async (data) => {
    return await apiClient.post('/accounts', data);
  },

  // Initialize default accounts
  initializeDefaults: async () => {
    return await apiClient.post('/accounts/initialize');
  },

  // Update account
  update: async (id, data) => {
    return await apiClient.put(`/accounts/${id}`, data);
  },

  // Delete account
  delete: async (id) => {
    return await apiClient.delete(`/accounts/${id}`);
  },
};

