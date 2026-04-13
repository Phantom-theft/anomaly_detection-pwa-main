import React, { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { setUser, setLoading, fetchUserData } from './store/slices/authSlice';
import { selectTheme } from './store/slices/uiSlice';
import { app } from './firebase/config';
import AppRoutes from "./routes/AppRoutes";

const auth = getAuth(app);

const App = () => {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);

  // Sync theme class on mount and theme change
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (theme === 'dark') {
        document.body.style.backgroundColor = "#030712";
    } else {
        document.body.style.backgroundColor = "";
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        dispatch(setLoading(true));
        
        const userToStore = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          emailVerified: currentUser.emailVerified
        };
        
        dispatch(setUser(userToStore));
        // This will set loading to false when done
        await dispatch(fetchUserData(userToStore));
      } else {
        dispatch(setUser(null));
        dispatch(setLoading(false));
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <AppRoutes />;
};

export default App;
