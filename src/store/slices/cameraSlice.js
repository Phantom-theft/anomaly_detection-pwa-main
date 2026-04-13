import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '../../firebase/config';

const db = getFirestore(app);

// Async thunk to fetch cameras from Firestore
export const fetchCameras = createAsyncThunk(
  'camera/fetchCameras',
  async (orgId, { rejectWithValue }) => {
    try {
      if (!orgId) {
        return [];
      }
      const camerasRef = collection(db, 'organizations', orgId, 'cameras');
      const snapshot = await getDocs(camerasRef);
      
      const cameras = snapshot.docs.map(doc => {
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
      
      return cameras;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to fetch a single camera
export const fetchCamera = createAsyncThunk(
  'camera/fetchCamera',
  async ({ orgId, cameraId }, { rejectWithValue }) => {
    try {
      if (!orgId || !cameraId) {
        throw new Error('Missing orgId or cameraId');
      }
      const cameraRef = doc(db, 'organizations', orgId, 'cameras', cameraId);
      const cameraDoc = await getDoc(cameraRef);
      
      if (cameraDoc.exists()) {
        const data = cameraDoc.data();
        // Convert Timestamps to serializable format
        const serializedData = { ...data };
        Object.keys(serializedData).forEach(key => {
          if (serializedData[key] && typeof serializedData[key].toDate === 'function') {
            serializedData[key] = serializedData[key].toDate().toISOString();
          }
        });
        return { id: cameraDoc.id, ...serializedData };
      } else {
        throw new Error('Camera not found');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  cameras: [],
  activeCamera: null,
  selectedCameraId: null,
  loading: false,
  error: null,
  filter: {
    status: 'all', // 'all', 'online', 'offline'
    searchQuery: ''
  }
};

const cameraSlice = createSlice({
  name: 'camera',
  initialState,
  reducers: {
    setActiveCamera: (state, action) => {
      state.activeCamera = action.payload;
    },
    setSelectedCameraId: (state, action) => {
      state.selectedCameraId = action.payload;
    },
    setCameraFilter: (state, action) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    clearCameraError: (state) => {
      state.error = null;
    },
    updateCameraStatus: (state, action) => {
      const { cameraId, status } = action.payload;
      const camera = state.cameras.find(c => c.id === cameraId);
      if (camera) {
        camera.status = status;
      }
    },
    addCamera: (state, action) => {
      state.cameras.push(action.payload);
    },
    removeCamera: (state, action) => {
      state.cameras = state.cameras.filter(camera => camera.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all cameras
      .addCase(fetchCameras.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCameras.fulfilled, (state, action) => {
        state.loading = false;
        state.cameras = action.payload;
      })
      .addCase(fetchCameras.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single camera
      .addCase(fetchCamera.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCamera.fulfilled, (state, action) => {
        state.loading = false;
        state.activeCamera = action.payload;
      })
      .addCase(fetchCamera.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setActiveCamera,
  setSelectedCameraId,
  setCameraFilter,
  clearCameraError,
  updateCameraStatus,
  addCamera,
  removeCamera
} = cameraSlice.actions;

// Selectors
export const selectCameras = (state) => state.camera.cameras;
export const selectActiveCamera = (state) => state.camera.activeCamera;
export const selectSelectedCameraId = (state) => state.camera.selectedCameraId;
export const selectCameraLoading = (state) => state.camera.loading;
export const selectCameraError = (state) => state.camera.error;
export const selectCameraFilter = (state) => state.camera.filter;

// Filtered cameras selector
export const selectFilteredCameras = (state) => {
  const { cameras, filter } = state.camera;
  
  return cameras.filter(camera => {
    // Filter by status
    if (filter.status !== 'all' && camera.status !== filter.status) {
      return false;
    }
    
    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      return (
        camera.name?.toLowerCase().includes(query) ||
        camera.location?.toLowerCase().includes(query) ||
        camera.ip_address?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
};

export default cameraSlice.reducer;
