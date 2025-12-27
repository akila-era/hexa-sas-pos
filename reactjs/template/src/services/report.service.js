import apiClient from '../utils/api';

export const reportService = {
  // Get sales summary
  getSalesSummary: async (params = {}) => {
    return await apiClient.get('/reports/sales/summary', { params });
  },

  // Get top products
  getTopProducts: async (params = {}) => {
    return await apiClient.get('/reports/sales/top-products', { params });
  },

  // Get daily sales
  getDailySales: async (params = {}) => {
    return await apiClient.get('/reports/sales/daily', { params });
  },

  // Get inventory summary
  getInventorySummary: async (params = {}) => {
    return await apiClient.get('/reports/inventory/summary', { params });
  },

  // Get purchase report
  getPurchaseReport: async (params = {}) => {
    return await apiClient.get('/reports/purchases', { params });
  },

  // Get purchase order report
  getPurchaseOrderReport: async (params = {}) => {
    return await apiClient.get('/reports/purchase-orders', { params });
  },

  // Get balance sheet
  getBalanceSheet: async (params = {}) => {
    return await apiClient.get('/reports/balance-sheet', { params });
  },

  // Get trial balance
  getTrialBalance: async (params = {}) => {
    return await apiClient.get('/reports/trial-balance', { params });
  },

  // Get cash flow
  getCashFlow: async (params = {}) => {
    return await apiClient.get('/reports/cash-flow', { params });
  },

  // Get invoice report
  getInvoiceReport: async (params = {}) => {
    return await apiClient.get('/reports/invoices', { params });
  },

  // Get stock history
  getStockHistory: async (params = {}) => {
    return await apiClient.get('/reports/stock-history', { params });
  },

  // Get sold stock
  getSoldStock: async (params = {}) => {
    return await apiClient.get('/reports/sold-stock', { params });
  },

  // Get supplier report
  getSupplierReport: async (params = {}) => {
    return await apiClient.get('/reports/suppliers', { params });
  },

  // Get supplier due report
  getSupplierDueReport: async (params = {}) => {
    return await apiClient.get('/reports/supplier-due', { params });
  },

  // Get customer report
  getCustomerReport: async (params = {}) => {
    return await apiClient.get('/reports/customers', { params });
  },

  // Get customer due report
  getCustomerDueReport: async (params = {}) => {
    return await apiClient.get('/reports/customer-due', { params });
  },

  // Get product report
  getProductReport: async (params = {}) => {
    return await apiClient.get('/reports/products', { params });
  },

  // Get product expiry report
  getProductExpiryReport: async (params = {}) => {
    return await apiClient.get('/reports/products/expired', { params });
  },

  // Get product quantity alert
  getProductQuantityAlert: async (params = {}) => {
    return await apiClient.get('/reports/products/quantity-alert', { params });
  },

  // Get expense report
  getExpenseReport: async (params = {}) => {
    return await apiClient.get('/reports/expenses', { params });
  },

  // Get income report
  getIncomeReport: async (params = {}) => {
    return await apiClient.get('/reports/income', { params });
  },

  // Get purchase tax report
  getPurchaseTaxReport: async (params = {}) => {
    return await apiClient.get('/reports/tax/purchase', { params });
  },

  // Get sales tax report
  getSalesTaxReport: async (params = {}) => {
    return await apiClient.get('/reports/tax/sales', { params });
  },

  // Get profit/loss report
  getProfitLossReport: async (params = {}) => {
    return await apiClient.get('/reports/profit-loss', { params });
  },

  // Get annual report
  getAnnualReport: async (params = {}) => {
    return await apiClient.get('/reports/annual', { params });
  },
};








