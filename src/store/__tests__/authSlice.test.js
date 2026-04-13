import authReducer, {
  setUser,
  setRole,
  setOrganization,
  setLoading,
  setError,
  logout,
  initializeAuth,
  fetchUserData,
  selectAuth,
  selectUser,
  selectRole,
  selectOrganization,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from '../slices/authSlice';

describe('authSlice', () => {
  describe('reducers', () => {
    const initialState = {
      user: null,
      role: 'guest',
      organization: null,
      loading: true,
      error: null,
      isAuthenticated: false,
    };

    it('should return the initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    describe('setUser', () => {
      it('should set user and update isAuthenticated', () => {
        const user = { uid: 'test-uid', email: 'test@example.com' };
        const state = authReducer(initialState, setUser(user));

        expect(state.user).toEqual(user);
        expect(state.isAuthenticated).toBe(true);
        expect(state.loading).toBe(false);
      });

      it('should set user to null and isAuthenticated to false', () => {
        const stateWithUser = {
          ...initialState,
          user: { uid: 'test-uid', email: 'test@example.com' },
          isAuthenticated: true,
        };
        const state = authReducer(stateWithUser, setUser(null));

        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
      });
    });

    describe('setRole', () => {
      it('should set role to the specified value', () => {
        const state = authReducer(initialState, setRole('admin'));
        expect(state.role).toBe('admin');
      });

      it('should set role to superadmin', () => {
        const state = authReducer(initialState, setRole('superadmin'));
        expect(state.role).toBe('superadmin');
      });
    });

    describe('setOrganization', () => {
      it('should set organization', () => {
        const org = { id: 'org-1', name: 'Test Org' };
        const state = authReducer(initialState, setOrganization(org));
        expect(state.organization).toEqual(org);
      });

      it('should set organization to null', () => {
        const stateWithOrg = {
          ...initialState,
          organization: { id: 'org-1', name: 'Test Org' },
        };
        const state = authReducer(stateWithOrg, setOrganization(null));
        expect(state.organization).toBeNull();
      });
    });

    describe('setLoading', () => {
      it('should set loading to true', () => {
        const state = authReducer(initialState, setLoading(true));
        expect(state.loading).toBe(true);
      });

      it('should set loading to false', () => {
        const loadingState = { ...initialState, loading: true };
        const state = authReducer(loadingState, setLoading(false));
        expect(state.loading).toBe(false);
      });
    });

    describe('setError', () => {
      it('should set error message', () => {
        const error = 'Authentication failed';
        const state = authReducer(initialState, setError(error));
        expect(state.error).toBe(error);
      });

      it('should clear error', () => {
        const errorState = { ...initialState, error: 'Some error' };
        const state = authReducer(errorState, setError(null));
        expect(state.error).toBeNull();
      });
    });

    describe('logout', () => {
      it('should reset state to initial values', () => {
        const loggedInState = {
          user: { uid: 'test-uid', email: 'test@example.com' },
          role: 'admin',
          organization: { id: 'org-1' },
          loading: false,
          error: null,
          isAuthenticated: true,
        };
        const state = authReducer(loggedInState, logout());

        expect(state.user).toBeNull();
        expect(state.role).toBe('guest');
        expect(state.organization).toBeNull();
        expect(state.isAuthenticated).toBe(false);
        expect(state.loading).toBe(false);
        expect(state.error).toBeNull();
      });
    });

    describe('initializeAuth', () => {
      it('should set loading to true', () => {
        const state = authReducer(initialState, initializeAuth());
        expect(state.loading).toBe(true);
      });
    });
  });

  describe('async thunks', () => {
    describe('fetchUserData', () => {
      it('should set loading to true on pending', () => {
        const state = authReducer(
          { user: null, role: 'guest', organization: null, loading: false, error: null, isAuthenticated: false },
          { type: fetchUserData.pending.type }
        );
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should set user data on fulfilled', () => {
        const user = { uid: 'test-uid', email: 'test@example.com' };
        const userData = { uid: 'test-uid', email: 'test@example.com', role: 'admin', org_id: 'org-1' };
        
        const state = authReducer(
          { user: null, role: 'guest', organization: null, loading: true, error: null, isAuthenticated: false },
          { type: fetchUserData.fulfilled.type, payload: userData }
        );

        expect(state.user).toEqual(userData);
        expect(state.role).toBe('admin');
        expect(state.organization).toBe('org-1');
        expect(state.isAuthenticated).toBe(true);
        expect(state.loading).toBe(false);
        expect(state.error).toBeNull();
      });

      it('should use default role if not provided in payload', () => {
        const userData = { uid: 'test-uid', email: 'test@example.com' };
        
        const state = authReducer(
          { user: null, role: 'guest', organization: null, loading: true, error: null, isAuthenticated: false },
          { type: fetchUserData.fulfilled.type, payload: userData }
        );

        expect(state.role).toBe('user');
      });

      it('should reset state on rejected', () => {
        const errorMessage = 'Failed to fetch user data';
        
        const state = authReducer(
          { user: { uid: 'test-uid' }, role: 'admin', organization: 'org-1', loading: true, error: null, isAuthenticated: true },
          { type: fetchUserData.rejected.type, payload: errorMessage }
        );

        expect(state.loading).toBe(false);
        expect(state.error).toBe(errorMessage);
        expect(state.user).toBeNull();
        expect(state.role).toBe('guest');
        expect(state.isAuthenticated).toBe(false);
      });
    });
  });

  describe('selectors', () => {
    const mockState = {
      auth: {
        user: { uid: 'test-uid', email: 'test@example.com' },
        role: 'admin',
        organization: { id: 'org-1' },
        loading: false,
        error: null,
        isAuthenticated: true,
      },
    };

    it('selectAuth should return auth state', () => {
      expect(selectAuth(mockState)).toEqual(mockState.auth);
    });

    it('selectUser should return user', () => {
      expect(selectUser(mockState)).toEqual({ uid: 'test-uid', email: 'test@example.com' });
    });

    it('selectRole should return role', () => {
      expect(selectRole(mockState)).toBe('admin');
    });

    it('selectOrganization should return organization', () => {
      expect(selectOrganization(mockState)).toEqual({ id: 'org-1' });
    });

    it('selectIsAuthenticated should return isAuthenticated', () => {
      expect(selectIsAuthenticated(mockState)).toBe(true);
    });

    it('selectAuthLoading should return loading', () => {
      expect(selectAuthLoading(mockState)).toBe(false);
    });

    it('selectAuthError should return error', () => {
      expect(selectAuthError(mockState)).toBeNull();
    });
  });
});