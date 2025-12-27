import api from './api';

const BASE_URL = '/online-orders';

/**
 * Online Order Service
 * Handles all online order related API calls
 */
const onlineOrderService = {
  /**
   * Get all online orders with pagination and filters
   * @param {Object} params - Query parameters (page, limit, search, status, customerId, etc.)
   * @returns {Promise} API response with orders list and pagination
   */
  getAll: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  /**
   * Get single online order by ID
   * @param {string} id - Order ID
   * @returns {Promise} API response with order details
   */
  getById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Create new online order
   * @param {Object} orderData - Order data
   * @returns {Promise} API response with created order
   */
  create: async (orderData) => {
    const response = await api.post(BASE_URL, orderData);
    return response.data;
  },

  /**
   * Update online order
   * @param {string} id - Order ID
   * @param {Object} orderData - Updated order data
   * @returns {Promise} API response with updated order
   */
  update: async (id, orderData) => {
    const response = await api.put(`${BASE_URL}/${id}`, orderData);
    return response.data;
  },

  /**
   * Delete online order
   * @param {string} id - Order ID
   * @returns {Promise} API response
   */
  delete: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Get payments for an order
   * @param {string} orderId - Order ID
   * @returns {Promise} API response with payments list
   */
  getPayments: async (orderId) => {
    const response = await api.get(`${BASE_URL}/${orderId}/payments`);
    return response.data;
  },

  /**
   * Create payment for an order
   * @param {string} orderId - Order ID
   * @param {Object} paymentData - Payment data (amount, paymentMethod, reference, note)
   * @returns {Promise} API response with created payment
   */
  createPayment: async (orderId, paymentData) => {
    const response = await api.post(`${BASE_URL}/${orderId}/payments`, paymentData);
    return response.data;
  },

  /**
   * Update payment
   * @param {string} orderId - Order ID
   * @param {string} paymentId - Payment ID
   * @param {Object} paymentData - Updated payment data
   * @returns {Promise} API response with updated payment
   */
  updatePayment: async (orderId, paymentId, paymentData) => {
    const response = await api.put(`${BASE_URL}/${orderId}/payments/${paymentId}`, paymentData);
    return response.data;
  },

  /**
   * Delete payment
   * @param {string} orderId - Order ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise} API response
   */
  deletePayment: async (orderId, paymentId) => {
    const response = await api.delete(`${BASE_URL}/${orderId}/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Download order PDF
   * @param {string} orderId - Order ID
   * @returns {Promise} PDF blob
   */
  downloadPdf: async (orderId) => {
    const response = await api.get(`${BASE_URL}/${orderId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status (PENDING, PROCESSING, COMPLETED, CANCELLED)
   * @returns {Promise} API response
   */
  updateStatus: async (orderId, status) => {
    const response = await api.put(`${BASE_URL}/${orderId}`, { status });
    return response.data;
  },

  /**
   * Get orders by customer
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getByCustomer: async (customerId, params = {}) => {
    const response = await api.get(BASE_URL, {
      params: { ...params, customerId },
    });
    return response.data;
  },

  /**
   * Get orders by status
   * @param {string} status - Order status
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getByStatus: async (status, params = {}) => {
    const response = await api.get(BASE_URL, {
      params: { ...params, status },
    });
    return response.data;
  },

  /**
   * Get orders by payment status
   * @param {string} paymentStatus - Payment status (Paid, Unpaid, Overdue)
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getByPaymentStatus: async (paymentStatus, params = {}) => {
    const response = await api.get(BASE_URL, {
      params: { ...params, paymentStatus },
    });
    return response.data;
  },
};

export default onlineOrderService;

