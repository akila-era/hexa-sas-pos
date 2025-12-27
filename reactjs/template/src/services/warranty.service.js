import apiClient from '../utils/api';

export const warrantyService = {
  // Get all warranties with filters
  getAll: async (params = {}) => {
    return await apiClient.get('/warranties', { params });
  },

  // Get warranty by ID
  getById: async (id) => {
    return await apiClient.get(`/warranties/${id}`);
  },

  // Create new warranty
  create: async (data) => {
    // Transform frontend format to backend format
    const backendData = {
      name: data.name,
      description: data.description,
      duration: parseInt(data.duration, 10),
      period: data.period?.toUpperCase() || 'MONTHS', // DAYS, WEEKS, MONTHS, YEARS
      isActive: data.status === 'Active' || data.isActive === true,
    };
    return await apiClient.post('/warranties', backendData);
  },

  // Update warranty
  update: async (id, data) => {
    // Transform frontend format to backend format
    const backendData = {};
    if (data.name !== undefined) backendData.name = data.name;
    if (data.description !== undefined) backendData.description = data.description;
    if (data.duration !== undefined) backendData.duration = parseInt(data.duration, 10);
    if (data.period !== undefined) backendData.period = data.period.toUpperCase();
    if (data.status !== undefined) backendData.isActive = data.status === 'Active';
    if (data.isActive !== undefined) backendData.isActive = data.isActive;
    
    return await apiClient.put(`/warranties/${id}`, backendData);
  },

  // Delete warranty
  delete: async (id) => {
    return await apiClient.delete(`/warranties/${id}`);
  },
};

