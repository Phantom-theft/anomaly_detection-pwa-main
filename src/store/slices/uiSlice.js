import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const getInitialSidebarOpen = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sidebarOpen') !== 'false';
  }
  return true;
};

const getInitialMuteState = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem("dashboard_muted");
    return saved !== null ? JSON.parse(saved) : true;
  }
  return true;
};

const initialState = {
  theme: getInitialTheme(),
  sidebarOpen: getInitialSidebarOpen(),
  isMuted: getInitialMuteState(),
  loading: {
    global: false,
    cameras: false,
    alerts: false,
    users: false,
    settings: false
  },
  errors: {
    global: null,
    cameras: null,
    alerts: null,
    users: null,
    auth: null,
    settings: null
  },
  notifications: [],
  modal: {
    isOpen: false,
    type: null, // 'confirm', 'alert', 'form'
    data: null
  },
  toasts: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
        document.documentElement.classList.toggle('dark', action.payload === 'dark');
      }
    },
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarOpen', state.sidebarOpen.toString());
      }
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarOpen', action.payload.toString());
      }
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
      if (typeof window !== 'undefined') {
        localStorage.setItem("dashboard_muted", JSON.stringify(state.isMuted));
      }
    },
    
    // Loading state management
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      if (key && key in state.loading) {
        state.loading[key] = value;
      } else {
        state.loading.global = value;
      }
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    
    // Error state management
    setError: (state, action) => {
      const { key, message } = action.payload;
      if (key && key in state.errors) {
        state.errors[key] = message;
      } else {
        state.errors.global = message;
      }
    },
    clearError: (state, action) => {
      const key = action.payload;
      if (key && key in state.errors) {
        state.errors[key] = null;
      } else {
        state.errors.global = null;
      }
    },
    clearAllErrors: (state) => {
      state.errors = Object.keys(state.errors).reduce((acc, key) => {
        acc[key] = null;
        return acc;
      }, {});
    },
    
    // Notification management
    addNotification: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...action.payload
      };
      state.notifications.unshift(notification);
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    
    // Modal management
    openModal: (state, action) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type || 'confirm',
        data: action.payload.data || null
      };
    },
    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        type: null,
        data: null
      };
    },
    
    // Toast management
    addToast: (state, action) => {
      const toast = {
        id: Date.now().toString(),
        ...action.payload
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearAllToasts: (state) => {
      state.toasts = [];
    },
    
    // Reset UI state (for logout)
    resetUI: (state) => {
      state.loading = initialState.loading;
      state.errors = initialState.errors;
      state.notifications = [];
      state.modal = initialState.modal;
      state.toasts = [];
    }
  }
});

export const {
  setTheme,
  toggleTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleMute,
  setLoading,
  setGlobalLoading,
  setError,
  clearError,
  clearAllErrors,
  addNotification,
  removeNotification,
  clearAllNotifications,
  openModal,
  closeModal,
  addToast,
  removeToast,
  clearAllToasts,
  resetUI
} = uiSlice.actions;

// Selectors
export const selectTheme = (state) => state.ui.theme;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectIsMuted = (state) => state.ui.isMuted;
export const selectLoading = (state) => state.ui.loading;
export const selectGlobalLoading = (state) => state.ui.loading.global;
export const selectErrors = (state) => state.ui.errors;
export const selectGlobalError = (state) => state.ui.errors.global;
export const selectNotifications = (state) => state.ui.notifications;
export const selectModal = (state) => state.ui.modal;
export const selectToasts = (state) => state.ui.toasts;

// Loading helper selector
export const selectIsLoading = (key) => (state) => {
  if (key && key in state.ui.loading) {
    return state.ui.loading[key];
  }
  return state.ui.loading.global;
};

// Error helper selector
export const selectErrorByKey = (key) => (state) => {
  if (key && key in state.ui.errors) {
    return state.ui.errors[key];
  }
  return state.ui.errors.global;
};

export default uiSlice.reducer;
