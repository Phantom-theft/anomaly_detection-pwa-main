import { FaBars } from "react-icons/fa";
import React, { useState } from "react";
import { getAuth } from "firebase/auth";
import userImg from "../assets/images/userImg.png";
import { useLocation } from "react-router-dom";
import ProfileSidebar from "./_ProfileSidebar"; // gagawin natin ito

export default function Header({ sidebar, setSidebar }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const photoURL = user?.photoURL || userImg;

  const location = useLocation();

  const pageTitles = {
    "/": "Dashboard",
    "/camera": "Camera",
    "/anomalies": "Anomalies",
    "/alert": "Alert",
    "/settings": "Settings",
  };

  const currentTitle = pageTitles[location.pathname];

  // state para sa profile sidebar
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center p-4 transition-colors duration-300">
        <button className="lg:hidden p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors" onClick={() => setSidebar(true)}>
          <FaBars className="text-gray-600 dark:text-gray-400 text-2xl" />
        </button>

        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{currentTitle}</h1>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setProfileOpen(true)}
            className="focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-full transition-shadow"
            aria-label="Open profile sidebar"
          >
            <img
              src={photoURL}
              alt="User"
              className="w-10 h-10 rounded-full object-cover cursor-pointer ring-2 ring-violet-100 dark:ring-violet-900/30"
            />
          </button>
        </div>
      </header>
      <ProfileSidebar open={profileOpen} setOpen={setProfileOpen} user={user} />
    </>
  );
}
