import { FaBars } from "react-icons/fa";
import React, { useState } from "react";
import { getAuth } from "firebase/auth";
import userImg from "../assets/images/userImg.png";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { logout } from "../firebase/config";
import { toast } from "react-toastify";
import ConfirmModal from "./ConfirmModal";

export default function Header({ sidebar, setSidebar }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const photoURL = user?.photoURL || userImg;
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const pageTitles = {
    "/": "Dashboard",
    "/camera": "Camera",
    "/anomalies": "Anomalies",
    "/alert": "Alert",
    "/settings": "Settings",
  };

  const currentTitle = pageTitles[location.pathname] || "Anomaly Detection";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center p-4 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors" onClick={() => setSidebar(true)}>
            <FaBars className="text-gray-600 dark:text-gray-400 text-2xl" />
          </button>
          <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">{currentTitle}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* User Profile Info (Read-only now) */}
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-xs font-black text-gray-800 dark:text-gray-200 tracking-tight">{user?.displayName || "Guest"}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Account Active</p>
          </div>

          <div className="h-8 w-[1px] bg-gray-100 dark:bg-gray-800 mx-1 hidden sm:block"></div>

          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 active:scale-95 shadow-sm hover:shadow-red-500/20"
            aria-label="Logout"
          >
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </header>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Sign Out?"
        message="Are you sure you want to log out of your account? You will need to sign in again to access the dashboard."
        confirmText="Sign Out"
        loading={isLoggingOut}
        type="danger"
      />
    </>
  );
}
