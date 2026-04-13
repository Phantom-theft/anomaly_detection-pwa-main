import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebase/config';

const db   = getFirestore(app);
const auth = getAuth(app);

const useAuthStatus = () => {
    const [user, setUser]       = useState(null);
    const [role, setRole]       = useState(null);
    const [orgId, setOrgId]     = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!isMounted) return;

            if (currentUser) {
                setUser(currentUser);
                try {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDoc    = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        if (isMounted) {
                            setRole(data.role   || 'user');
                            setOrgId(data.org_id || null);
                            setLoading(false);
                        }
                    } else {
                        if (isMounted) {
                            setRole('user');
                            setOrgId(null);
                            setLoading(false);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    if (isMounted) {
                        setRole('user');
                        setOrgId(null);
                        setLoading(false);
                    }
                }
            } else {
                setUser(null);
                setRole('guest');
                setOrgId(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    return { user, role, orgId, loading };
};

export default useAuthStatus;