import apiClient from '../utils/api';

export const saleService = {
  // Get all sales with filters
  getAll: async (params = {}) => {
    return await apiClient.get('/sales', { params });
  },

  // Get sale by ID
  getById: async (id) => {
    return await apiClient.get(`/sales/${id}`);
  },

  // Create new sale
  create: async (data) => {
    return await apiClient.post('/sales', data);
  },

  // Update sale
  update: async (id, data) => {
    return await apiClient.put(`/sales/${id}`, data);
  },

  // Delete sale
  delete: async (id) => {
    return await apiClient.delete(`/sales/${id}`);
  },

  // =====================
  // PAYMENTS
  // =====================

  // Get payments for a sale (Show Payments)
  getPayments: async (saleId) => {
    return await apiClient.get(`/sales/${saleId}/payments`);
  },

  // Create payment for a sale (Create Payment)
  createPayment: async (saleId, data) => {
    return await apiClient.post(`/sales/${saleId}/payments`, data);
  },

  // Update payment
  updatePayment: async (saleId, paymentId, data) => {
    return await apiClient.put(`/sales/${saleId}/payments/${paymentId}`, data);
  },

  // Delete payment
  deletePayment: async (saleId, paymentId) => {
    return await apiClient.delete(`/sales/${saleId}/payments/${paymentId}`);
  },

  // =====================
  // UTILITIES
  // =====================

  // Download sale as PDF
  downloadPdf: async (id) => {
    return await apiClient.get(`/sales/${id}/pdf`, { responseType: 'blob' });
  },

  // Get sales by date range
  getByDateRange: async (startDate, endDate, params = {}) => {
    return await apiClient.get('/sales', {
      params: { ...params, startDate, endDate }
    });
  },

  // Get sales by customer
  getByCustomer: async (customerId, params = {}) => {
    return await apiClient.get('/sales', {
      params: { ...params, customerId }
    });
  },

  // Get sales by status
  getByStatus: async (status, params = {}) => {
    return await apiClient.get('/sales', {
      params: { ...params, status }
    });
  },

  // Get sales by payment status
  getByPaymentStatus: async (paymentStatus, params = {}) => {
    return await apiClient.get('/sales', {
      params: { ...params, paymentStatus }
    });
  },
};
