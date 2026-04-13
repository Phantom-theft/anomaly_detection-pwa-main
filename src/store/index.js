import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cameraReducer from './slices/cameraSlice';
import alertReducer from './slices/alertSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    camera: cameraReducer,
    alert: alertReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state
        ignoredPaths: ['ui.notifications', 'ui.toasts'],
        // Ignore these action types
        ignoredActions: ['ui/addNotification', 'ui/addToast']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export default store;
