import axios from 'axios';
import { getAuth, currentUser } from 'firebase/auth';
import { app } from '../firebase/config';

// Get base URL from environment variable
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420'
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (user) {
        // Get Firebase ID token
        const idToken = await user.getIdToken();
        config.headers.Authorization = `Bearer ${idToken}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      // Continue without token if user not authenticated
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Handle specific HTTP errors
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - could redirect to login
          console.error('Unauthorized - Please log in again');
          // Could dispatch a logout action here
          break;
        case 403:
          console.error('Forbidden - You do not have permission');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API Error:', response.data?.message || 'Unknown error');
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - Please check your connection');
    } else {
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Error handling wrapper
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      success: false,
      status: error.response.status,
      message: error.response.data?.message || 'Server error occurred',
      data: error.response.data
    };
  } else if (error.request) {
    // Request made but no response
    return {
      success: false,
      status: 0,
      message: 'No response from server. Please check your connection.',
      data: null
    };
  } else {
    // Error in request setup
    return {
      success: false,
      status: 0,
      message: error.message || 'Request failed',
      data: null
    };
  }
};

// Success response wrapper
const handleApiSuccess = (response) => {
  return {
    success: true,
    status: response.status,
    message: response.data?.message || 'Success',
    data: response.data
  };
};

// API Methods
export const apiService = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return handleApiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return handleApiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return handleApiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      return handleApiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return handleApiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Upload file with progress
  upload: async (url, file, onProgress = () => {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      });
      
      return handleApiSuccess(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Download file
  download: async (url, filename = 'download') => {
    try {
      const response = await api.get(url, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true };
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Export axios instance for custom configurations
export { api };

// Export BASE_URL for reference
export { BASE_URL };

export default apiService;
