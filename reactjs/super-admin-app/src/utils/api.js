import axios from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5557/api/v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 403 Forbidden errors (e.g., TENANT_INACTIVE, ACCOUNT_INACTIVE)
    if (error.response?.status === 403) {
      const errorData = error.response?.data || {};
      
      // Ensure error data has the expected structure
      const formattedError = {
        success: false,
        error: {
          code: errorData?.error?.code || 'FORBIDDEN',
          message: errorData?.error?.message || errorData?.message || 'Access forbidden'
        }
      };
      
      // Clear tokens for any 403 error (security best practice)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Return the formatted error data so the component can display it
      return Promise.reject(formattedError);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Format other errors consistently
    const errorData = error.response?.data || {};
    const formattedError = errorData.success === false 
      ? errorData 
      : {
          success: false,
          error: {
            code: errorData?.error?.code || 'UNKNOWN_ERROR',
            message: errorData?.error?.message || errorData?.message || error.message || 'An error occurred'
          }
        };
    
    return Promise.reject(formattedError);
  }
);

export default apiClient;



