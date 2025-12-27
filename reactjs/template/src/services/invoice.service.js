import apiClient from '../utils/api';

export const invoiceService = {
  // Get all invoices with filters
  getAll: async (params = {}) => {
    return await apiClient.get('/invoices', { params });
  },

  // Get overdue invoices
  getOverdue: async (params = {}) => {
    return await apiClient.get('/invoices/overdue', { params });
  },

  // Get invoice by ID
  getById: async (id) => {
    return await apiClient.get(`/invoices/${id}`);
  },

  // Create new invoice
  create: async (data) => {
    // Transform frontend format to backend format
    const backendData = {
      customerId: data.customerId,
      saleId: data.saleId,
      items: data.items?.map(item => ({
        productId: item.productId,
        qty: item.qty,
        price: item.price,
        discount: item.discount || 0,
        tax: item.tax || 0,
      })),
      discount: data.discount || 0,
      taxAmount: data.taxAmount || 0,
      dueDate: data.dueDate,
      note: data.note,
      terms: data.terms,
    };
    return await apiClient.post('/invoices', backendData);
  },

  // Update invoice
  update: async (id, data) => {
    return await apiClient.put(`/invoices/${id}`, data);
  },

  // Add payment to invoice
  addPayment: async (id, data) => {
    // Transform frontend format to backend format
    const backendData = {
      amount: data.amount,
      paymentMethod: data.paymentMethod || data.paidBy,
      reference: data.reference,
      note: data.note || data.description,
    };
    return await apiClient.post(`/invoices/${id}/payment`, backendData);
  },

  // Delete invoice
  delete: async (id) => {
    return await apiClient.delete(`/invoices/${id}`);
  },

  // Get invoices by customer
  getByCustomer: async (customerId, params = {}) => {
    return await apiClient.get('/invoices', {
      params: { ...params, customerId }
    });
  },

  // Get invoices by status
  getByStatus: async (status, params = {}) => {
    return await apiClient.get('/invoices', {
      params: { ...params, status }
    });
  },

  // Download invoice as PDF
  downloadPdf: async (id) => {
    return await apiClient.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  },

  // Print invoice
  print: async (id) => {
    return await apiClient.get(`/invoices/${id}/print`);
  },
};
