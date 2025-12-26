import apiClient from '../utils/api';

const BASE_PATH = '/super-admin';

// Dashboard Service
export const dashboardService = {
  getStats: async () => {
    return await apiClient.get(`${BASE_PATH}/dashboard/stats`);
  },
  getChartData: async (period = 'weekly') => {
    return await apiClient.get(`${BASE_PATH}/dashboard/charts?period=${period}`);
  },
  getRecentTransactions: async (limit = 5) => {
    return await apiClient.get(`${BASE_PATH}/dashboard/recent-transactions?limit=${limit}`);
  },
  getRecentCompanies: async (limit = 5) => {
    return await apiClient.get(`${BASE_PATH}/dashboard/recent-companies?limit=${limit}`);
  },
  getExpiredPlans: async (limit = 5) => {
    return await apiClient.get(`${BASE_PATH}/dashboard/expired-plans?limit=${limit}`);
  },
  getPendingDomains: async (limit = 5) => {
    return await apiClient.get(`${BASE_PATH}/dashboard/pending-domains?limit=${limit}`);
  },
};

// Companies Service
export const companiesService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiClient.get(`${BASE_PATH}/companies${queryString ? `?${queryString}` : ''}`);
  },
  getById: async (id) => {
    return await apiClient.get(`${BASE_PATH}/companies/${id}`);
  },
  create: async (data) => {
    return await apiClient.post(`${BASE_PATH}/companies`, data);
  },
  update: async (id, data) => {
    return await apiClient.put(`${BASE_PATH}/companies/${id}`, data);
  },
  delete: async (id) => {
    return await apiClient.delete(`${BASE_PATH}/companies/${id}`);
  },
  upgradePlan: async (id, data) => {
    return await apiClient.post(`${BASE_PATH}/companies/${id}/upgrade`, data);
  },
  getStats: async () => {
    return await apiClient.get(`${BASE_PATH}/companies/stats`);
  },
};

// Packages Service
export const packagesService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiClient.get(`${BASE_PATH}/packages${queryString ? `?${queryString}` : ''}`);
  },
  getById: async (id) => {
    return await apiClient.get(`${BASE_PATH}/packages/${id}`);
  },
  create: async (data) => {
    return await apiClient.post(`${BASE_PATH}/packages`, data);
  },
  update: async (id, data) => {
    return await apiClient.put(`${BASE_PATH}/packages/${id}`, data);
  },
  delete: async (id) => {
    return await apiClient.delete(`${BASE_PATH}/packages/${id}`);
  },
  getStats: async () => {
    return await apiClient.get(`${BASE_PATH}/packages/stats`);
  },
};

// Subscriptions Service
export const subscriptionsService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiClient.get(`${BASE_PATH}/subscriptions${queryString ? `?${queryString}` : ''}`);
  },
  getById: async (id) => {
    return await apiClient.get(`${BASE_PATH}/subscriptions/${id}`);
  },
  create: async (data) => {
    return await apiClient.post(`${BASE_PATH}/subscriptions`, data);
  },
  update: async (id, data) => {
    return await apiClient.put(`${BASE_PATH}/subscriptions/${id}`, data);
  },
  delete: async (id) => {
    return await apiClient.delete(`${BASE_PATH}/subscriptions/${id}`);
  },
  getStats: async () => {
    return await apiClient.get(`${BASE_PATH}/subscriptions/stats`);
  },
};

// Domains Service
export const domainsService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiClient.get(`${BASE_PATH}/domains${queryString ? `?${queryString}` : ''}`);
  },
  getById: async (id) => {
    return await apiClient.get(`${BASE_PATH}/domains/${id}`);
  },
  create: async (data) => {
    return await apiClient.post(`${BASE_PATH}/domains`, data);
  },
  update: async (id, data) => {
    return await apiClient.put(`${BASE_PATH}/domains/${id}`, data);
  },
  delete: async (id) => {
    return await apiClient.delete(`${BASE_PATH}/domains/${id}`);
  },
  approve: async (id) => {
    return await apiClient.post(`${BASE_PATH}/domains/${id}/approve`);
  },
  reject: async (id) => {
    return await apiClient.post(`${BASE_PATH}/domains/${id}/reject`);
  },
  getStats: async () => {
    return await apiClient.get(`${BASE_PATH}/domains/stats`);
  },
};

// Transactions Service
export const transactionsService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiClient.get(`${BASE_PATH}/transactions${queryString ? `?${queryString}` : ''}`);
  },
  getById: async (id) => {
    return await apiClient.get(`${BASE_PATH}/transactions/${id}`);
  },
  getStats: async () => {
    return await apiClient.get(`${BASE_PATH}/transactions/stats`);
  },
};

// Super Admin Users Service
export const superAdminUsersService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiClient.get(`${BASE_PATH}/users${queryString ? `?${queryString}` : ''}`);
  },
  getById: async (id) => {
    return await apiClient.get(`${BASE_PATH}/users/${id}`);
  },
  create: async (data) => {
    return await apiClient.post(`${BASE_PATH}/users`, data);
  },
  update: async (id, data) => {
    return await apiClient.put(`${BASE_PATH}/users/${id}`, data);
  },
  delete: async (id) => {
    return await apiClient.delete(`${BASE_PATH}/users/${id}`);
  },
  toggleStatus: async (id) => {
    return await apiClient.patch(`${BASE_PATH}/users/${id}/toggle-status`);
  },
};

export default {
  dashboard: dashboardService,
  companies: companiesService,
  packages: packagesService,
  subscriptions: subscriptionsService,
  domains: domainsService,
  transactions: transactionsService,
  superAdminUsers: superAdminUsersService,
};





