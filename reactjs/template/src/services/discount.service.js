import api from './api';

const BASE_URL = '/discounts';

const discountService = {
  getAll: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (discountData) => {
    const response = await api.post(BASE_URL, discountData);
    return response.data;
  },

  update: async (id, discountData) => {
    const response = await api.put(`${BASE_URL}/${id}`, discountData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  getByPlan: async (discountPlanId, params = {}) => {
    const response = await api.get(BASE_URL, {
      params: { ...params, discountPlanId },
    });
    return response.data;
  },
};

export default discountService;

