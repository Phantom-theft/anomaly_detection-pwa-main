import React, { useState, useEffect } from "react";
import { FaAngleRight, FaKey, FaCheck, FaXmark } from "react-icons/fa6"; 
import { logout, updateUserPassword, db } from "../firebase/config"; // Removed deleteAccount
import { doc, getDoc } from "firebase/firestore";
import { AiOutlineLogout } from 'react-icons/ai';
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectTheme } from "../store/slices/uiSlice";

export default function ProfileSidebar({ open, setOpen, user }) {
  const theme = useSelector(selectTheme);
  const darkMode = theme === 'dark';

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(""); 
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("User");
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // --- FEATURE: Check AI Backend Status ---
  useEffect(() => {
    if (!open) return; // Only check when sidebar is open
    
    let isChecking = false;
    const checkStatus = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch('http://localhost:5000/logs', { signal: controller.signal });
        clearTimeout(timeoutId);
        setIsBackendOnline(res.ok);
      } catch {
        setIsBackendOnline(false);
      } finally {
        isChecking = false;
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [open]);

  // --- FEATURE: Fetch User Role ---
  useEffect(() => {
    const fetchRole = async () => {
      if (user?.uid) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || "User");
        }
      }
    };
    fetchRole();
  }, [user]);

  const handleSavePassword = async () => {
    if (!currentPassword) {
        toast.warning("Please enter your current password.");
        return;
    }
    if (newPassword.length < 6) {
        toast.warning("New password must be at least 6 characters.");
        return;
    }
    if (currentPassword === newPassword) {
        toast.error("New password cannot be the same as your current password.");
        return; 
    }

    setLoading(true);
    const success = await updateUserPassword(currentPassword, newPassword);
    setLoading(false);

    if (success) {
        setIsEditingPassword(false);
        setNewPassword("");
        setCurrentPassword("");
        setShowCurrentPass(false);
        setShowNewPass(false);
    }
  };

  return (
    <div
      className={`fixed right-0 top-0 bg-white dark:bg-gray-900 w-64 h-screen shadow-2xl transition-all duration-300 z-50 border-l border-gray-100 dark:border-gray-800
        ${open ? "translate-x-0" : "translate-x-64"}`}
    >
      <div className={`p-4 flex justify-between border-b items-center transition-colors ${darkMode ? "bg-gray-800/50 border-gray-800" : "bg-gray-50 border-gray-100"}`}>
        <h1 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-700"}`}>My Profile</h1>
        <button onClick={() => setOpen(false)} className={`p-2 rounded-full transition-colors ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-200 text-gray-500"}`}>
          <FaAngleRight className="text-xl" />
        </button>
      </div>

      {/* --- HEADER: AVATAR, STATUS DOT, & ROLE --- */}
      <div className={`p-6 flex flex-col items-center gap-3 border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
        <div className="relative">
            <img
            src={user?.photoURL || `https://api.dicebear.com/9.x/initials/svg?seed=${user?.displayName || 'User'}`}
            alt="Profile"
            className={`w-24 h-24 rounded-full object-cover border-4 shadow-sm ${darkMode ? "border-violet-900/30 shadow-violet-900/20" : "border-violet-100"}`}
            />
            {/* Status Green Dot */}
            <div 
                className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 shadow-sm ${
                    isBackendOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                } ${darkMode ? "border-gray-900" : "border-white"}`}
            ></div>
        </div>

        <div className="text-center">
            <h2 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{user?.displayName || "Guest"}</h2>
            <p className={`text-xs text-gray-500 mb-2`}>{user?.email}</p>
            
            {/* Role Badge */}
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                userRole.toLowerCase() === 'admin' 
                    ? 'bg-violet-600 text-white shadow-md' 
                    : (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500')
            }`}>
                {userRole}
            </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {!isEditingPassword ? (
            <button 
                onClick={() => setIsEditingPassword(true)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                    darkMode ? "text-gray-300 hover:bg-gray-800 hover:text-violet-400" : "text-gray-700 hover:bg-violet-50 hover:text-violet-600"
                }`}
            >
                <FaKey className="text-lg" />
                <span>Change Password</span>
            </button>
        ) : (
            <div className={`p-3 rounded-xl border animate-fade-in ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <p className="text-xs font-bold text-gray-500 mb-1">Current Password</p>
                <div className="relative mb-2">
                    <input 
                        type={showCurrentPass ? "text" : "password"} 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Verify current password"
                        className={`w-full p-2 text-sm border rounded-lg focus:outline-none focus:border-violet-500 pr-8 transition-colors ${
                            darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200"
                        }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-2 top-2 text-gray-500 hover:text-violet-500"
                    >
                        {showCurrentPass ? (
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                           </svg>
                        ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                           </svg>
                        )}
                    </button>
                </div>

                <p className="text-xs font-bold text-gray-500 mb-1">New Password</p>
                <div className="relative mb-2">
                    <input 
                        type={showNewPass ? "text" : "password"} 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className={`w-full p-2 text-sm border rounded-lg focus:outline-none focus:border-violet-500 pr-8 transition-colors ${
                            darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200"
                        }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-2 top-2 text-gray-500 hover:text-violet-500"
                    >
                        {showNewPass ? (
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                           </svg>
                        ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                           </svg>
                        )}
                    </button>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={handleSavePassword}
                        disabled={loading}
                        className="flex-1 bg-violet-500 text-white py-1 rounded-lg text-sm font-bold hover:bg-violet-600 flex justify-center items-center gap-1 transition-colors active:scale-95"
                    >
                        {loading ? "Saving..." : <><FaCheck /> Save</>}
                    </button>
                    <button 
                        onClick={() => {
                            setIsEditingPassword(false);
                            setNewPassword("");
                            setCurrentPassword("");
                            setShowCurrentPass(false);
                            setShowNewPass(false);
                        }}
                        className={`flex-1 py-1 rounded-lg text-sm font-bold flex justify-center items-center gap-1 transition-colors active:scale-95 ${
                            darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        <FaXmark /> Cancel
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* --- FOOTER: LOGOUT BUTTON ONLY --- */}
      <div className={`absolute bottom-0 w-full p-4 border-t transition-colors ${darkMode ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-100"}`}>
        <button 
            onClick={logout} 
            className='w-full py-2 px-4 flex items-center justify-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-lg font-bold shadow-md transition-all active:scale-95'
        >
            <AiOutlineLogout className="text-2xl" />
            <span>Logout</span>
        </button>
      </div>

    </div>
  );
}
