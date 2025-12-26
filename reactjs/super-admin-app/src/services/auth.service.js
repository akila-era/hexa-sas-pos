import apiClient from '../utils/api';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      // Log the full error for debugging
      console.error('Login API error:', error);
      console.error('Error structure:', {
        error,
        response: error?.response,
        data: error?.response?.data,
        status: error?.response?.status
      });
      // Re-throw so Login component can handle it
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async () => {
    return await apiClient.get('/auth/me');
  },
};

export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

export const isSuperAdmin = () => {
  const user = getStoredUser();
  if (!user) return false;
  
  const roleName = user?.role?.name?.toLowerCase() || "";
  return (
    roleName.includes("super admin") || 
    roleName.includes("superadmin") || 
    roleName === "admin" ||
    roleName.includes("super")
  );
};



