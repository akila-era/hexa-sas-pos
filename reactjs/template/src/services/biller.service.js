import api from './api';

const BASE_URL = '/billers';

const billerService = {
  getAll: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (billerData) => {
    const response = await api.post(BASE_URL, billerData);
    return response.data;
  },

  update: async (id, billerData) => {
    const response = await api.put(`${BASE_URL}/${id}`, billerData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};

export default billerService;

