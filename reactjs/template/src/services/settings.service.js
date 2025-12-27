import apiClient from '../utils/api';

export const settingsService = {
  // Get all settings
  getAll: async (group) => {
    return await apiClient.get('/settings', { params: { group } });
  },

  // Get settings by group
  getByGroup: async (group) => {
    return await apiClient.get(`/settings/group/${group}`);
  },

  // Get single setting
  get: async (group, key) => {
    return await apiClient.get(`/settings/${group}/${key}`);
  },

  // Set single setting
  set: async (data) => {
    return await apiClient.post('/settings', data);
  },

  // Set multiple settings
  setMany: async (group, settings) => {
    return await apiClient.post('/settings/batch', { group, settings });
  },

  // Initialize default settings
  initializeDefaults: async () => {
    return await apiClient.post('/settings/initialize');
  },

  // Delete setting
  delete: async (group, key) => {
    return await apiClient.delete(`/settings/${group}/${key}`);
  },
};

