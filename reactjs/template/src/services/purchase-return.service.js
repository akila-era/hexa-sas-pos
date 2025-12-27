import apiClient from '../utils/api';

export const purchaseReturnService = {
  // Get all purchase returns with filters
  getAll: async (params = {}) => {
    return await apiClient.get('/purchase-returns', { params });
  },

  // Get purchase return by ID
  getById: async (id) => {
    return await apiClient.get(`/purchase-returns/${id}`);
  },

  // Create new purchase return
  create: async (data) => {
    // Transform frontend format to backend format
    const backendData = {
      purchaseId: data.purchaseId,
      supplierId: data.supplierId,
      items: data.items?.map(item => ({
        productId: item.productId,
        qty: item.qty,
        price: item.price,
      })),
      reason: data.reason,
      note: data.note,
    };
    return await apiClient.post('/purchase-returns', backendData);
  },

  // Update purchase return
  update: async (id, data) => {
    return await apiClient.put(`/purchase-returns/${id}`, data);
  },

  // Delete purchase return
  delete: async (id) => {
    return await apiClient.delete(`/purchase-returns/${id}`);
  },

  // Get purchase returns by supplier
  getBySupplier: async (supplierId, params = {}) => {
    return await apiClient.get('/purchase-returns', {
      params: { ...params, supplierId }
    });
  },

  // Get purchase returns by status
  getByStatus: async (status, params = {}) => {
    return await apiClient.get('/purchase-returns', {
      params: { ...params, status }
    });
  },
};

