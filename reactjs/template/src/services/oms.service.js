import apiClient from '../utils/api';

export const omsService = {
  // Get all orders with filters
  getAll: async (params = {}) => {
    return await apiClient.get('/oms/orders', { params });
  },

  // Get order by ID
  getById: async (id) => {
    return await apiClient.get(`/oms/orders/${id}`);
  },

  // Create new order
  create: async (data) => {
    return await apiClient.post('/oms/orders', data);
  },

  // Update order
  update: async (id, data) => {
    return await apiClient.put(`/oms/orders/${id}`, data);
  },

  // Cancel order
  delete: async (id, reason) => {
    return await apiClient.delete(`/oms/orders/${id}`, { data: { reason } });
  },

  // =====================
  // PAYMENTS
  // =====================

  // Add payment to order
  addPayment: async (orderId, data) => {
    return await apiClient.post(`/oms/orders/${orderId}/payment`, data);
  },

  // =====================
  // STATISTICS
  // =====================

  // Get order statistics
  getStats: async (params = {}) => {
    return await apiClient.get('/oms/stats', { params });
  },

  // =====================
  // UTILITIES
  // =====================

  // Get orders by status
  getByStatus: async (status, params = {}) => {
    return await apiClient.get('/oms/orders', {
      params: { ...params, status }
    });
  },

  // Get orders by payment status
  getByPaymentStatus: async (paymentStatus, params = {}) => {
    return await apiClient.get('/oms/orders', {
      params: { ...params, paymentStatus }
    });
  },

  // Get orders by customer
  getByCustomer: async (customerId, params = {}) => {
    return await apiClient.get('/oms/orders', {
      params: { ...params, customerId }
    });
  },

  // Get orders by date range
  getByDateRange: async (startDate, endDate, params = {}) => {
    return await apiClient.get('/oms/orders', {
      params: { ...params, startDate, endDate }
    });
  },
};

