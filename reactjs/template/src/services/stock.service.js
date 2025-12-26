import apiClient from '../utils/api';

export const stockService = {
  // Get stock for product and warehouse
  getStock: async (productId, warehouseId) => {
    return await apiClient.get(`/stock/${productId}/${warehouseId}`);
  },

  // Get stock movements
  getMovements: async (params = {}) => {
    return await apiClient.get('/stock/movements', { params });
  },

  // Create stock movement
  createMovement: async (data) => {
    return await apiClient.post('/stock/movements', data);
  },

  // Check stock availability
  checkAvailability: async (items) => {
    return await apiClient.post('/stock/check-availability', { items });
  },
};







