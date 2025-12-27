import api from './api';

const BASE_URL = '/coupons';

const couponService = {
  getAll: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (couponData) => {
    const response = await api.post(BASE_URL, couponData);
    return response.data;
  },

  update: async (id, couponData) => {
    const response = await api.put(`${BASE_URL}/${id}`, couponData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  validateCode: async (code, customerId) => {
    const response = await api.post(`${BASE_URL}/validate`, { code, customerId });
    return response.data;
  },
};

export default couponService;

