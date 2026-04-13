import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../../firebase/config';

const db = getFirestore(app);
const auth = getAuth(app);

// Async thunk to fetch user data from Firestore
export const fetchUserData = createAsyncThunk(
  'auth/fetchUserData',
  async (user, { rejectWithValue }) => {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fetch user data timed out')), 5000)
      );

      const fetchPromise = (async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          
          const serializedData = { ...data };
          Object.keys(serializedData).forEach(key => {
            if (serializedData[key] && typeof serializedData[key].toDate === 'function') {
              serializedData[key] = serializedData[key].toDate().toISOString();
            }
          });

          return {
            uid: user.uid,
            email: user.email,
            ...serializedData
          };
        } else {
          return {
            uid: user.uid,
            email: user.email,
            role: 'user',
            org_id: null
          };
        }
      })();

      // Race against timeout
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  role: 'guest',
  organization: null,
  loading: true,
  error: null,
  isAuthenticated: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.loading = false;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
    setOrganization: (state, action) => {
      state.organization = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.role = 'guest';
      state.organization = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    initializeAuth: (state) => {
      state.loading = true;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.user = action.payload;
        // Explicitly use role from Firestore payload
        state.role = action.payload.role || 'user';
        state.organization = action.payload.org_id || null;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.role = 'guest';
        state.isAuthenticated = false;
      });
  }
});

export const { 
  setUser, 
  setRole, 
  setOrganization, 
  setLoading, 
  setError, 
  logout,
  initializeAuth 
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectRole = (state) => state.auth.role;
export const selectOrganization = (state) => state.auth.organization;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
