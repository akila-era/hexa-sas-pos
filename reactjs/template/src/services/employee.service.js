import apiClient from '../utils/api';

export const employeeService = {
  // Get all employees
  getAll: async (params = {}) => {
    return await apiClient.get('/employees', { params });
  },

  // Get employee by ID
  getById: async (id) => {
    return await apiClient.get(`/employees/${id}`);
  },

  // Get employee attendance summary
  getAttendanceSummary: async (id, month, year) => {
    return await apiClient.get(`/employees/${id}/attendance-summary`, {
      params: { month, year },
    });
  },

  // Create new employee
  create: async (data) => {
    return await apiClient.post('/employees', data);
  },

  // Update employee
  update: async (id, data) => {
    return await apiClient.put(`/employees/${id}`, data);
  },

  // Delete employee
  delete: async (id) => {
    return await apiClient.delete(`/employees/${id}`);
  },
};

