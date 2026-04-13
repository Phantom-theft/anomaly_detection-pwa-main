// Mock API module
const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
};

// Default mock implementations
mockApi.get.mockResolvedValue({ data: {} });
mockApi.post.mockResolvedValue({ data: {} });
mockApi.put.mockResolvedValue({ data: {} });
mockApi.delete.mockResolvedValue({ data: {} });

export const mockApiInstance = mockApi;

// Factory function to create a configured mock API
export const createMockApi = (overrides = {}) => {
  const api = {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn(),
      },
      response: {
        use: jest.fn(),
        eject: jest.fn(),
      },
    },
    ...overrides,
  };
  return api;
};

// Mock endpoints
export const mockEndpoints = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
  },
  CAMERAS: {
    LIST: '/api/cameras',
    DETAIL: (id) => `/api/cameras/${id}`,
    ADD: '/api/cameras/add',
    UPDATE: (id) => `/api/cameras/${id}`,
    DELETE: (id) => `/api/cameras/${id}`,
  },
  ALERTS: {
    LIST: '/api/alerts',
    DETAIL: (id) => `/api/alerts/${id}`,
    ACK: (id) => `/api/alerts/${id}/acknowledge`,
  },
  DETECTIONS: {
    LIST: '/api/detections',
    DETAIL: (id) => `/api/detections/${id}`,
    SETTINGS: '/api/detections/settings',
  },
  USERS: {
    LIST: '/api/users',
    DETAIL: (id) => `/api/users/${id}`,
    ADD: '/api/users/add',
    UPDATE: (id) => `/api/users/${id}`,
    DELETE: (id) => `/api/users/${id}`,
  },
};

export default mockApi;