import apiClient from '../utils/api';

export const leaveService = {
  // Get all leave requests
  getAll: async (params = {}) => {
    return await apiClient.get('/leaves', { params });
  },

  // Get leave by ID
  getById: async (id) => {
    return await apiClient.get(`/leaves/${id}`);
  },

  // Get leave balance for employee
  getBalance: async (employeeId) => {
    return await apiClient.get(`/leaves/balance/${employeeId}`);
  },

  // Create leave request
  create: async (data) => {
    return await apiClient.post('/leaves', data);
  },

  // Approve leave
  approve: async (id) => {
    return await apiClient.put(`/leaves/${id}/approve`);
  },

  // Reject leave
  reject: async (id, reason) => {
    return await apiClient.put(`/leaves/${id}/reject`, { reason });
  },

  // Cancel leave
  cancel: async (id) => {
    return await apiClient.put(`/leaves/${id}/cancel`);
  },
};

