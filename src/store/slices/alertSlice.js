import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFirestore, collection, getDocs, query, where, orderBy, limit, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { app } from '../../firebase/config';

const db = getFirestore(app);

// Async thunk to fetch alerts from Firestore
export const fetchAlerts = createAsyncThunk(
  'alert/fetchAlerts',
  async ({ orgId, limit: alertLimit = 50 }, { rejectWithValue }) => {
    try {
      if (!orgId) {
        return [];
      }
      const alertsRef = collection(db, 'organizations', orgId, 'alerts');
      const q = query(
        alertsRef,
        orderBy('timestamp', 'desc'),
        limit(alertLimit)
      );
      const snapshot = await getDocs(q);
      
      const alerts = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Timestamps to serializable format
        const serializedData = { ...data };
        Object.keys(serializedData).forEach(key => {
          if (serializedData[key] && typeof serializedData[key].toDate === 'function') {
            serializedData[key] = serializedData[key].toDate().toISOString();
          }
        });
        return {
          id: doc.id,
          ...serializedData
        };
      });
      
      return alerts;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to fetch unread alerts count
export const fetchUnreadAlertsCount = createAsyncThunk(
  'alert/fetchUnreadCount',
  async (orgId, { rejectWithValue }) => {
    try {
      if (!orgId) {
        return 0;
      }
      const alertsRef = collection(db, 'organizations', orgId, 'alerts');
      const q = query(alertsRef, where('read', '==', false));
      const snapshot = await getDocs(q);
      
      return snapshot.size;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to mark alert as read
export const markAlertAsRead = createAsyncThunk(
  'alert/markAsRead',
  async ({ orgId, alertId }, { rejectWithValue }) => {
    try {
      if (!orgId || !alertId) {
        throw new Error('Missing orgId or alertId');
      }
      const alertRef = doc(db, 'organizations', orgId, 'alerts', alertId);
      await updateDoc(alertRef, { read: true });
      
      return alertId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to mark all alerts as read
export const markAllAlertsAsRead = createAsyncThunk(
  'alert/markAllAsRead',
  async (orgId, { rejectWithValue }) => {
    try {
      if (!orgId) {
        throw new Error('Missing orgId');
      }
      const alertsRef = collection(db, 'organizations', orgId, 'alerts');
      const q = query(alertsRef, where('read', '==', false));
      const snapshot = await getDocs(q);
      
      const updatePromises = snapshot.docs.map(alertDoc => 
        updateDoc(alertDoc.ref, { read: true })
      );
      
      await Promise.all(updatePromises);
      
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to delete an alert
export const deleteAlert = createAsyncThunk(
  'alert/deleteAlert',
  async ({ orgId, alertId }, { rejectWithValue }) => {
    try {
      if (!orgId || !alertId) {
        throw new Error('Missing orgId or alertId');
      }
      const alertRef = doc(db, 'organizations', orgId, 'alerts', alertId);
      await deleteDoc(alertRef);
      
      return alertId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  alerts: [],
  unreadCount: 0,
  loading: false,
  error: null,
  filter: {
    type: 'all', // 'all', 'theft', 'anomaly'
    readStatus: 'all', // 'all', 'read', 'unread'
    searchQuery: ''
  },
  selectedAlert: null
};

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    setAlertFilter: (state, action) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    setSelectedAlert: (state, action) => {
      state.selectedAlert = action.payload;
    },
    clearAlertError: (state) => {
      state.error = null;
    },
    addAlert: (state, action) => {
      state.alerts.unshift(action.payload);
      state.unreadCount += 1;
    },
    updateAlertInList: (state, action) => {
      const { id, ...updates } = action.payload;
      const index = state.alerts.findIndex(alert => alert.id === id);
      if (index !== -1) {
        state.alerts[index] = { ...state.alerts[index], ...updates };
      }
    },
    removeAlertFromList: (state, action) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert && !alert.read) {
        state.unreadCount -= 1;
      }
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch alerts
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch unread count
      .addCase(fetchUnreadAlertsCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      // Mark as read
      .addCase(markAlertAsRead.fulfilled, (state, action) => {
        const alert = state.alerts.find(a => a.id === action.payload);
        if (alert && !alert.read) {
          alert.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark all as read
      .addCase(markAllAlertsAsRead.fulfilled, (state) => {
        state.alerts = state.alerts.map(alert => ({ ...alert, read: true }));
        state.unreadCount = 0;
      })
      // Delete alert
      .addCase(deleteAlert.fulfilled, (state, action) => {
        const alert = state.alerts.find(a => a.id === action.payload);
        if (alert && !alert.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
      });
  }
});

export const {
  setAlertFilter,
  setSelectedAlert,
  clearAlertError,
  addAlert,
  updateAlertInList,
  removeAlertFromList,
  setUnreadCount,
  decrementUnreadCount
} = alertSlice.actions;

// Selectors
export const selectAlerts = (state) => state.alert.alerts;
export const selectUnreadCount = (state) => state.alert.unreadCount;
export const selectAlertLoading = (state) => state.alert.loading;
export const selectAlertError = (state) => state.alert.error;
export const selectAlertFilter = (state) => state.alert.filter;
export const selectSelectedAlert = (state) => state.alert.selectedAlert;

// Filtered alerts selector
export const selectFilteredAlerts = (state) => {
  const { alerts, filter } = state.alert;
  
  return alerts.filter(alert => {
    // Filter by type
    if (filter.type !== 'all' && alert.type !== filter.type) {
      return false;
    }
    
    // Filter by read status
    if (filter.readStatus === 'read' && !alert.read) {
      return false;
    }
    if (filter.readStatus === 'unread' && alert.read) {
      return false;
    }
    
    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      return (
        alert.message?.toLowerCase().includes(query) ||
        alert.camera_name?.toLowerCase().includes(query) ||
        alert.location?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
};

export default alertSlice.reducer;
