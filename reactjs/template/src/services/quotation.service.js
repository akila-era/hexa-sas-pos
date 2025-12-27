import apiClient from '../utils/api';

export const quotationService = {
  // Get all quotations with filters
  getAll: async (params = {}) => {
    return await apiClient.get('/quotations', { params });
  },

  // Get quotation by ID
  getById: async (id) => {
    return await apiClient.get(`/quotations/${id}`);
  },

  // Create new quotation
  create: async (data) => {
    // Transform frontend format to backend format
    const backendData = {
      customerId: data.customerId,
      items: data.items?.map(item => ({
        productId: item.productId,
        qty: item.qty,
        price: item.price,
        discount: item.discount || 0,
        tax: item.tax || 0,
      })),
      discount: data.discount || 0,
      taxAmount: data.taxAmount || 0,
      validUntil: data.validUntil,
      note: data.note,
      terms: data.terms,
    };
    return await apiClient.post('/quotations', backendData);
  },

  // Update quotation
  update: async (id, data) => {
    return await apiClient.put(`/quotations/${id}`, data);
  },

  // Update quotation status
  updateStatus: async (id, status) => {
    return await apiClient.put(`/quotations/${id}/status`, { status });
  },

  // Convert quotation to sale
  convertToSale: async (id, branchId) => {
    return await apiClient.post(`/quotations/${id}/convert`, { branchId });
  },

  // Delete quotation
  delete: async (id) => {
    return await apiClient.delete(`/quotations/${id}`);
  },

  // Get quotations by customer
  getByCustomer: async (customerId, params = {}) => {
    return await apiClient.get('/quotations', {
      params: { ...params, customerId }
    });
  },

  // Get quotations by status
  getByStatus: async (status, params = {}) => {
    return await apiClient.get('/quotations', {
      params: { ...params, status }
    });
  },

  // Get quotations by product
  getByProduct: async (productId, params = {}) => {
    return await apiClient.get('/quotations', {
      params: { ...params, productId }
    });
  },
};
