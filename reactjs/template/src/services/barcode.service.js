import apiClient from '../utils/api';

export const barcodeService = {
  // Generate barcode for product
  generate: async (productId, format = 'CODE128') => {
    return await apiClient.post('/barcodes/generate', { productId, format });
  },

  // Generate QR code for product
  generateQR: async (productId, data = {}) => {
    return await apiClient.post('/barcodes/qr', { productId, ...data });
  },

  // Get barcode by product ID
  getByProduct: async (productId) => {
    return await apiClient.get(`/barcodes/product/${productId}`);
  },

  // Print barcode
  print: async (productId, quantity = 1, format = 'CODE128') => {
    return await apiClient.post('/barcodes/print', { productId, quantity, format });
  },

  // Bulk generate barcodes
  bulkGenerate: async (productIds, format = 'CODE128') => {
    return await apiClient.post('/barcodes/bulk-generate', { productIds, format });
  },
};

