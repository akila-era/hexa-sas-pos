import apiClient from '../utils/api';

export const stockService = {
  // =====================
  // MANAGE STOCK
  // =====================
  
  // Get all stock items (for manage stock page)
  getAll: async (params = {}) => {
    return await apiClient.get('/stock', { params });
  },

  // Add new stock
  create: async (data) => {
    return await apiClient.post('/stock', data);
  },

  // Update stock quantity
  update: async (id, data) => {
    return await apiClient.put(`/stock/${id}`, data);
  },

  // Get stock for specific product and warehouse
  getStock: async (productId, warehouseId) => {
    return await apiClient.get(`/stock/${productId}/${warehouseId}`);
  },

  // =====================
  // STOCK MOVEMENTS
  // =====================

  // Get stock movements
  getMovements: async (params = {}) => {
    return await apiClient.get('/stock/movements', { params });
  },

  // Create stock movement
  createMovement: async (data) => {
    return await apiClient.post('/stock/movements', data);
  },

  // =====================
  // STOCK ADJUSTMENTS
  // =====================

  // Get all adjustments
  getAdjustments: async (params = {}) => {
    return await apiClient.get('/stock/adjustments', { params });
  },

  // Create adjustment
  createAdjustment: async (data) => {
    // Transform frontend fields to backend format
    const backendData = {
      warehouseId: data.warehouseId,
      productId: data.productId,
      type: data.type, // 'ADD' or 'SUBTRACT'
      quantity: parseInt(data.quantity, 10),
      referenceNumber: data.referenceNumber,
      personId: data.personId,
      reason: data.reason,
      notes: data.notes,
    };
    return await apiClient.post('/stock/adjustments', backendData);
  },

  // =====================
  // STOCK TRANSFERS
  // =====================

  // Get all transfers
  getTransfers: async (params = {}) => {
    return await apiClient.get('/stock/transfers', { params });
  },

  // Get single transfer
  getTransferById: async (id) => {
    return await apiClient.get(`/stock/transfers/${id}`);
  },

  // Create transfer
  createTransfer: async (data) => {
    // Transform frontend fields to backend format
    const backendData = {
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      items: data.items.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity, 10),
      })),
    };
    return await apiClient.post('/stock/transfers', backendData);
  },

  // Delete transfer
  deleteTransfer: async (id) => {
    return await apiClient.delete(`/stock/transfers/${id}`);
  },

  // =====================
  // AVAILABILITY CHECK
  // =====================

  // Check stock availability
  checkAvailability: async (items) => {
    return await apiClient.post('/stock/check-availability', { items });
  },
};
