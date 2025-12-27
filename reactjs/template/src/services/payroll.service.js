import apiClient from '../utils/api';

export const payrollService = {
  // Get all payrolls
  getAll: async (params = {}) => {
    return await apiClient.get('/payroll', { params });
  },

  // Get payroll summary
  getSummary: async (month, year) => {
    return await apiClient.get('/payroll/summary', {
      params: { month, year },
    });
  },

  // Get payroll by ID
  getById: async (id) => {
    return await apiClient.get(`/payroll/${id}`);
  },

  // Generate payroll
  generate: async (data) => {
    return await apiClient.post('/payroll/generate', data);
  },

  // Process payroll
  process: async (id, data) => {
    return await apiClient.put(`/payroll/${id}/process`, data);
  },

  // Mark payroll as paid
  markAsPaid: async (id, paymentMethod) => {
    return await apiClient.put(`/payroll/${id}/pay`, { paymentMethod });
  },

  // Bulk mark as paid
  bulkMarkAsPaid: async (ids, paymentMethod) => {
    return await apiClient.put('/payroll/bulk-pay', { ids, paymentMethod });
  },
};

