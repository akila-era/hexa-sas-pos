import api from './api';

const BASE_URL = '/gift-cards';

const giftCardService = {
  getAll: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (giftCardData) => {
    const response = await api.post(BASE_URL, giftCardData);
    return response.data;
  },

  update: async (id, giftCardData) => {
    const response = await api.put(`${BASE_URL}/${id}`, giftCardData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  redeem: async (id, amount) => {
    const response = await api.post(`${BASE_URL}/${id}/redeem`, { amount });
    return response.data;
  },
};

export default giftCardService;

