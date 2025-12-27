import api from './api';

const BASE_URL = '/discount-plans';

const discountPlanService = {
  getAll: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (planData) => {
    const response = await api.post(BASE_URL, planData);
    return response.data;
  },

  update: async (id, planData) => {
    const response = await api.put(`${BASE_URL}/${id}`, planData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};

export default discountPlanService;

