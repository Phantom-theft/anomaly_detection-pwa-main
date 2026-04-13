import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

// Import your slices
import authReducer from '../store/slices/authSlice';
import cameraReducer from '../store/slices/cameraSlice';
import alertReducer from '../store/slices/alertSlice';
import uiReducer from '../store/slices/uiSlice';

/**
 * Creates a pre-configured Redux store for testing
 * @param {Object} preloadedState - Initial state for the store
 * @returns {Object} Configured store
 */
export const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      camera: cameraReducer,
      alert: alertReducer,
      ui: uiReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

/**
 * Renders a component with Redux Provider and Router
 * @param {React.Component} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} Render result with store
 */
export const renderWithProviders = (
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

/**
 * Renders a component with only Redux Provider (no Router)
 * @param {React.Component} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} Render result with store
 */
export const renderWithStore = (
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

/**
 * Creates a mock router for testing
 * @param {Object} options - Router options
 * @returns {Object} Mock router object
 */
export const mockRouter = (options = {}) => ({
  push: jest.fn(),
  replace: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  ...options,
});

/**
 * Creates a mockNavigate function for react-router-dom v6
 * @param {Object} options - Navigate options
 * @returns {Function} Mock navigate function
 */
export const mockNavigate = jest.fn();

/**
 * Creates mock location object
 * @param {Object} options - Location options
 * @returns {Object} Mock location
 */
export const mockLocation = (options = {}) => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  ...options,
});

/**
 * Creates a mock history object for useNavigate
 * @returns {Object} Mock history object
 */
export const createMockHistory = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  go: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  action: 'POP',
  location: {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  },
});

/**
 * Waits for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Resolves after timeout
 */
export const waitFor = (ms = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Waits for a condition to be true
 * @param {Function} condition - Function that returns boolean
 * @param {number} timeout - Maximum time to wait in ms
 * @returns {Promise} Resolves when condition is true
 */
export const waitForCondition = async (condition, timeout = 1000) => {
  const start = Date.now();
  while (true) {
    if (condition()) return;
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await waitFor(50);
  }
};

/**
 * Creates a mock user event for testing
 * @returns {Object} Mock user object
 */
export const createMockUser = () => ({
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2024-01-01T00:00:00.000Z',
    lastSignInTime: '2024-01-01T00:00:00.000Z',
  },
});

/**
 * Creates mock camera data
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock camera object
 */
export const createMockCamera = (overrides = {}) => ({
  id: 'camera-1',
  name: 'Test Camera',
  url: 'rtsp://example.com/stream',
  location: 'Test Location',
  status: 'active',
  organizationId: 'org-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  detectionSettings: {
    enabled: true,
    confidenceThreshold: 0.7,
    alertEnabled: true,
  },
  ...overrides,
});

/**
 * Creates mock alert data
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock alert object
 */
export const createMockAlert = (overrides = {}) => ({
  id: 'alert-1',
  cameraId: 'camera-1',
  cameraName: 'Test Camera',
  type: 'theft',
  confidence: 0.95,
  timestamp: new Date().toISOString(),
  acknowledged: false,
  acknowledgedBy: null,
  acknowledgedAt: null,
  imageUrl: 'https://example.com/image.jpg',
  organizationId: 'org-1',
  ...overrides,
});

/**
 * Creates mock auth state
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock auth state
 */
export const createMockAuthState = (overrides = {}) => ({
  user: createMockUser(),
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  error: null,
  ...overrides,
});

/**
 * Cleanup after tests
 * @returns {void}
 */
export const afterEach = () => {
  cleanup();
};

// Re-export testing-library utilities
export * from '@testing-library/react';
export { render, cleanup, waitFor };