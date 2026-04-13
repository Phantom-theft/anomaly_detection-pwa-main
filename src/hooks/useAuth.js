import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';
import { 
  selectUser, 
  selectRole, 
  selectOrganization, 
  selectIsAuthenticated, 
  selectAuthLoading,
  selectAuthError,
  logout as logoutAction
} from '../store/slices/authSlice';
import { resetUI } from '../store/slices/uiSlice';
import { app } from '../firebase/config';

const auth = getAuth(app);

/**
 * Custom hook for authentication using Redux
 * Provides auth state and methods from Redux store
 */
const useAuth = () => {
  const dispatch = useDispatch();
  
  // Selectors from Redux store
  const user = useSelector(selectUser);
  const role = useSelector(selectRole);
  const organization = useSelector(selectOrganization);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      dispatch(logoutAction());
      dispatch(resetUI());
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, [dispatch]);

  // Check if user has specific role
  const hasRole = useCallback((requiredRole) => {
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    return role === requiredRole;
  }, [role]);

  // Check if user is admin or above
  const isAdmin = useCallback(() => {
    return role === 'admin' || role === 'superadmin';
  }, [role]);

  // Check if user is superadmin
  const isSuperAdmin = useCallback(() => {
    return role === 'superadmin';
  }, [role]);

  // Check if user is regular user
  const isUser = useCallback(() => {
    return role === 'user';
  }, [role]);

  return {
    user,
    role,
    organization,
    orgId: organization,
    isAuthenticated,
    loading,
    error,
    signOut,
    hasRole,
    isAdmin,
    isSuperAdmin,
    isUser
  };
};

export default useAuth;
