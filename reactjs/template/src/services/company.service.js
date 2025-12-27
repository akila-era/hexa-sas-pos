import apiClient from '../utils/api';

export const companyService = {
  // Create company
  create: async (data) => {
    return await apiClient.post('/companies', data);
  },

  // Get all companies
  getAll: async (params = {}) => {
    return await apiClient.get('/companies', { params });
  },

  // Get company by ID
  getById: async (id) => {
    return await apiClient.get(`/companies/${id}`);
  },

  // Update company
  update: async (id, data) => {
    return await apiClient.put(`/companies/${id}`, data);
  },

  // Branches
  // Get all branches
  getBranches: async (params = {}) => {
    return await apiClient.get('/companies/branches', { params });
  },

  // Get branch by ID
  getBranchById: async (id) => {
    return await apiClient.get(`/companies/branches/${id}`);
  },

  // Create branch
  createBranch: async (data) => {
    return await apiClient.post('/companies/branches', data);
  },

  // Update branch
  updateBranch: async (id, data) => {
    return await apiClient.put(`/companies/branches/${id}`, data);
  },
};








