import apiClient from '../utils/api';

export const salesReturnService = {
  // Get all sales returns with filters
  getAll: async (params = {}) => {
    return await apiClient.get('/sales-returns', { params });
  },

  // Get sales return by ID
  getById: async (id) => {
    return await apiClient.get(`/sales-returns/${id}`);
  },

  // Create new sales return
  create: async (data) => {
    // Transform frontend format to backend format
    const backendData = {
      saleId: data.saleId,
      branchId: data.branchId,
      customerId: data.customerId,
      items: data.items?.map(item => ({
        productId: item.productId,
        qty: item.qty,
        price: item.price,
      })),
      reason: data.reason,
      note: data.note,
    };
    return await apiClient.post('/sales-returns', backendData);
  },

  // Update sales return
  update: async (id, data) => {
    return await apiClient.put(`/sales-returns/${id}`, data);
  },

  // Delete sales return
  delete: async (id) => {
    return await apiClient.delete(`/sales-returns/${id}`);
  },

  // Get sales returns by customer
  getByCustomer: async (customerId, params = {}) => {
    return await apiClient.get('/sales-returns', {
      params: { ...params, customerId }
    });
  },

  // Get sales returns by status
  getByStatus: async (status, params = {}) => {
    return await apiClient.get('/sales-returns', {
      params: { ...params, status }
    });
  },
};

