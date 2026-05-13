import { initializeApp, deleteApp, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where
} from "firebase/firestore";
import { toast } from "react-toastify";
import { getAuth } from "firebase/auth";
import emailjs from "@emailjs/browser";
import CryptoJS from "crypto-js";


emailjs.init(process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "PN_-9VL6oJundVqaH");

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBkzsnfMCkjb57ZGOtAxtwYlQO6DIcitys",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "anomalydetection-18e91.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "anomalydetection-18e91",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "anomalydetection-18e91.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "659795367154",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:659795367154:web:d76596f4acb6ee49f82c6b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. Admin Registration Logic
const adminRegister = async (username, email, password) => {
  try {
    const { getAuth, createUserWithEmailAndPassword, updateProfile } =
      await import("firebase/auth");

    const auth = getAuth(app);
    const safeEmail = email.trim().toLowerCase();

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      safeEmail,
      password
    );

    const user = userCredential.user;

    await updateProfile(user, { displayName: username });

    // Auto-generate org_id para sa bagong admin
    const org_id = `org_${user.uid.slice(0, 8)}_${Date.now()}`;

    await setDoc(doc(db, "users", user.uid), {
      uid:       user.uid,
      username,
      email:     safeEmail,
      createdAt: new Date(),
      role:      "admin",
      org_id,
    });

    // I-create ang org document
    await setDoc(doc(db, "organizations", org_id), {
      org_id,
      admin_uid:    user.uid,
      admin_name:   username,
      admin_email:  safeEmail,
      createdAt:    new Date(),
      status:       "active",
    });

    await new Promise(res => setTimeout(res, 500));

    toast.success("Admin account created!");
    return { user, role: "admin", org_id };
  } catch (error) {
    toast.error(error.message);
    return null;
  }
};


// 2. Create User (Secondary App Method to stay logged in as Admin)
const createUserEntry = async (userData, password) => {
  let secondaryApp;
  try {
    const { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } = await import("firebase/auth");
    try {
      secondaryApp = getApp("Secondary");
    } catch (e) {
      secondaryApp = initializeApp(firebaseConfig, "Secondary");
    }
    const secondaryAuth = getAuth(secondaryApp);
    const safeEmail = userData.email.trim().toLowerCase();

    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, safeEmail, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: userData.username });
    
    // Tiny delay to ensure Auth trigger finishes
    await new Promise(res => setTimeout(res, 1000));

    await setDoc(doc(db, "users", user.uid), {
      uid:      user.uid,
      username: userData.username,
      email:    safeEmail,
      createdAt: new Date(),
      role:     userData.role || 'user',
      org_id:   userData.org_id || null,
    });

    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
    toast.success(`User "${userData.username}" created!`);
    return true;
  } catch (error) {
    if (secondaryApp) try { await deleteApp(secondaryApp); } catch (e) { /* ignore deletion error */ }
    toast.error(error.message);
    return false;
  }
};

// 3. Login with Role Retrieval
const login = async (email, password) => {
  try {
    const { getAuth, signInWithEmailAndPassword, signOut } = await import("firebase/auth");
    const auth = getAuth(app);
    
    const safeEmail = email.trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, safeEmail, password);
    const user = userCredential.user;
    
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      toast.success("Welcome back!");
      return { user, role: userData.role || 'user', org_id: userData.org_id || null };
    } else {
      await signOut(auth);
      toast.error("User profile not found.");
      return null;
    }
  } catch (error) {
    console.error("Login error:", error);
    toast.error("Invalid credentials.");
    return null;
  }
};

// 4. Secure Account Deletion (Self-Service)
const deleteAccount = async (currentPassword) => {
  try {
    const { getAuth, deleteUser, EmailAuthProvider, reauthenticateWithCredential } = await import("firebase/auth");
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) {
      toast.error("No active session.");
      return false;
    }

    // A. Re-authenticate (Required for sensitive actions)
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // B. Security Check: Prevent admins from deleting themselves via this path
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().role === 'admin') {
        toast.error("Admin accounts cannot be deleted here.");
        return false;
    }

    // C. Delete Firestore Data FIRST
    await deleteDoc(doc(db, "users", user.uid));
    
    // D. Delete Auth Account
    await deleteUser(user);
    
    toast.success("Account deleted.");
    return true;
  } catch (error) {
    if (error.code === 'auth/wrong-password') toast.error("Incorrect password.");
    else toast.error("Deletion failed. Contact support.");
    return false;
  }
};

// 5. Utility Functions
const logout = async () => {
  try {
    const { getAuth, signOut } = await import("firebase/auth");
    const auth = getAuth(app);
    await signOut(auth);
    toast.success("Logged out.");
  } catch (error) {
    toast.error("Logout failed.");
  }
};

const forgotPassword = async (email) => {
  try {
    const { getAuth, sendPasswordResetEmail } = await import("firebase/auth");
    const auth = getAuth(app);
    const safeEmail = email.trim().toLowerCase();

    // 1. Check if user exists in Firestore first to give better feedback
    const q = query(collection(db, "users"), where("email", "==", safeEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      toast.error("No account found with this email address.");
      return false;
    }

    // 2. Send the actual Firebase reset email
    await sendPasswordResetEmail(auth, safeEmail);
    toast.success("Password reset link has been sent to your email!");
    return true;
  } catch (error) {
    console.error("Forgot password error:", error);
    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      toast.error("No user found with this email in authentication.");
    } else {
      toast.error(error.message || "Failed to send reset email.");
    }
    return false;
  }
};

const updateUserPassword = async (currentPassword, newPassword) => {
  try {
    const { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } = await import("firebase/auth");
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (user) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success("Password updated!");
      return true;
    }
  } catch (error) {
    toast.error(error.message);
    return false;
  }
};

const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) { return []; }
};

const updateUserEntry = async (userId, newData) => {
  try {
    await updateDoc(doc(db, "users", userId), newData);
    toast.success("User updated!");
    return true;
  } catch (error) { return false; }
};

const deleteUserEntry = async (userId) => {
  try {
    const rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    let cleanUrl = rawApiUrl.replace(/\/+$/, "");
    if (cleanUrl.includes("ngrok-free.dev")) cleanUrl = cleanUrl.replace(":5000", "");
    if (typeof window !== 'undefined' && window.location.protocol === "https:" && cleanUrl.includes("ngrok-free.dev")) {
      cleanUrl = cleanUrl.replace("http://", "https://");
    }
    const BASE_URL = cleanUrl;
    // 1. I-delete sa Firebase Auth via backend
    try {
      await fetch(`${BASE_URL}/delete_user/${userId}`, { 
        method: "DELETE",
        headers: { "ngrok-skip-browser-warning": "69420" }
      });
    } catch (authErr) {
      console.warn("Auth deletion failed (may already be deleted):", authErr);
    }

    // 2. I-delete sa Firestore
    await deleteDoc(doc(db, "users", userId));

    toast.success("User removed from system.");
    return true;
  } catch (error) {
    toast.error("Failed to remove user.");
    return false;
  }
};

const getToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("No user logged in");
  return await user.getIdToken();
};


// Check if any admin exists in Firestore
const checkIfAdminExists = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "superadmin"));
    const snapshot = await getDocs(q);
    return !snapshot.empty; // true if admin exists
  } catch (error) {
    console.error("Error checking admin existence:", error);
    return false; // fail-safe
  }
};


const sendAdminVerificationCode = async (email) => {
  try {
    const docId = email.replace(/\./g, ',');
    const docRef = doc(db, "admin_verification_codes", docId);

    // 🔍 check existing code
    const existingSnap = await getDoc(docRef);

    if (existingSnap.exists()) {
      const data = existingSnap.data();

      // delete expired OR force delete old code
      if (Date.now() > data.expiresAt) {
        await deleteDoc(docRef);
      } else {
        // optional: block spam resend
        throw new Error("A verification code is still active.");
      }
    }

    //  generate new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = CryptoJS.SHA256(code).toString();

    //  save new code
    await setDoc(docRef, {
      email,
      codeHash,
      expiresAt: Date.now() + 120 * 1000, // 120s (2 minutes)
      createdAt: Date.now(),
    });

    //  send email
    await emailjs.send(
      process.env.REACT_APP_EMAILJS_SERVICE_ID || "service_1ntt8cr",
      process.env.REACT_APP_EMAILJS_TEMPLATE_ID || "template_czrrbo8",
      {
        to_email: email,
        verification_code: code,
      }
    );

    return true;
  } catch (err) {
    console.error("Send verification error:", err.message);
    return false;
  }
};




const verifyAdminCode = async (email, inputCode) => {
  try {
    const docId = email.replace(/\./g, ','); // same encoding
    const docRef = doc(db, "admin_verification_codes", docId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return false;

    const data = snap.data();
    const inputHash = CryptoJS.SHA256(inputCode).toString();

    if (data.codeHash !== inputHash) return false;
    if (Date.now() > data.expiresAt) {
      await deleteDoc(docRef);
      return false;
    }

    await deleteDoc(docRef); // one-time use
    return true;
  } catch {
    return false;
  }
};







// Get org_id of current admin
const getAdminOrgId = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data().org_id || null : null;
  } catch { return null; }
};

// Get all organizations (super admin only)
const getAllOrganizations = async () => {
  try {
    const snapshot = await getDocs(collection(db, "organizations"));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
};

// Get users by org_id
const getUsersByOrg = async (org_id) => {
  try {
    const q = query(collection(db, "users"), where("org_id", "==", org_id));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
};

// Super admin registration
const superAdminRegister = async (username, email, password) => {
  try {
    const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
    const auth = getAuth(app);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: username });
    await setDoc(doc(db, "users", user.uid), {
      uid:       user.uid,
      username,
      email,
      createdAt: new Date(),
      role:      "superadmin",
      org_id:    null,
    });
    toast.success("Super Admin account created!");
    return { user, role: "superadmin" };
  } catch (error) {
    toast.error(error.message);
    return null;
  }
};

export {
  app,
  db,
  login,
  adminRegister,
  superAdminRegister,
  logout,
  forgotPassword,
  getToken,
  deleteAccount,
  updateUserPassword,
  getAllUsers,
  createUserEntry,
  updateUserEntry,
  deleteUserEntry,
  checkIfAdminExists,
  sendAdminVerificationCode,
  verifyAdminCode,
  getAdminOrgId,
  getAllOrganizations,
  getUsersByOrg,
};