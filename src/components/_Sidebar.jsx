import React from "react";
import { FaAngleRight, FaUserGroup, FaShieldHalved, FaBuilding } from 'react-icons/fa6';
import { TbLayoutDashboardFilled } from 'react-icons/tb';
import { GiCctvCamera } from 'react-icons/gi';
import { MdNotificationsActive } from 'react-icons/md';
import { IoSettingsSharp } from 'react-icons/io5';
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectTheme } from "../store/slices/uiSlice";
import logo from "../assets/icons/192x192.png";

export default function Sidebar({ sidebar, setSidebar, role }) {
  const theme = useSelector(selectTheme);
  const darkMode = theme === 'dark';

  const allNavItems = [
    {
      name:  "Dashboard",
      path:  "/",
      icon:  <TbLayoutDashboardFilled className="text-2xl" />,
      roles: ["superadmin", "admin", "user"],
    },
    {
      name:  "Platform Admins", 
      path:  "/system-users",
      icon:  <FaUserGroup className="text-2xl" />,
      roles: ["superadmin"],
    },
    {
      name:  "Household",
      path:  "/organizations",
      icon:  <FaBuilding className="text-2xl" />, 
      roles: ["superadmin"],
    },
    {
      name:  "System Settings",
      path:  "/system-settings",
      icon:  <IoSettingsSharp className="text-2xl" />,
      roles: ["superadmin"],
    },
    {
      name:  "Camera",
      path:  "/camera-admin",
      icon:  <GiCctvCamera className="text-2xl" />,
      roles: ["admin"],
    },
    {
      name:  "Users",
      path:  "/system-users",
      icon:  <FaUserGroup className="text-2xl" />,
      roles: ["admin"],
    },
    {
      name:  "Settings",
      path:  "/settings",
      icon:  <IoSettingsSharp className="text-2xl" />,
      roles: ["admin", "user"],
    },
    {
      name:  "Camera",
      path:  "/camera",
      icon:  <GiCctvCamera className="text-2xl" />,
      roles: ["user"],
    },
    {
      name:  "Alert",
      path:  "/alert",
      icon:  <MdNotificationsActive className="text-2xl" />,
      roles: ["user"],
    },
  ];

  const filteredNavItems = allNavItems.filter(item => item.roles.includes(role));

  const roleBadge = {
    superadmin: { label: "Super Admin", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    admin:      { label: "Admin",       color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
    user:       { label: "User",        color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  }[role] || { label: role, color: "bg-gray-100 text-gray-500" };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {sidebar && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] lg:hidden transition-opacity duration-300"
          onClick={() => setSidebar(false)}
        />
      )}

      <div className={`fixed bg-white dark:bg-gray-900 w-[280px] lg:w-64 h-screen shadow-2xl transition-all duration-300 animate-sidebar-glow
        ${sidebar ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 lg:static z-50 flex flex-col border-r border-gray-100 dark:border-gray-800`}>

        {/* Header */}
        <div className="p-6 flex flex-col items-center border-b border-gray-100 dark:border-gray-800 gap-4 animate-slide-right">
          <div className="w-full flex justify-end items-center lg:hidden">
            <button className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-violet-50 transition-colors" onClick={() => setSidebar(false)}>
              <FaAngleRight className="text-gray-600 dark:text-gray-400 text-xl" />
            </button>
          </div>
          <div className="w-full">
            <h1 className="font-extrabold text-xl leading-tight text-gray-800 dark:text-white animate-branding-breath">
              Anomaly <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                Detection System
              </span>
            </h1>
            <span className={`mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${darkMode ? "bg-violet-900/30 text-violet-300" : roleBadge.color}`}>
              {role === "superadmin" && <FaShieldHalved className="inline mr-1" />}
              {roleBadge.label}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-1 mt-2 flex-1 overflow-y-auto">
          {filteredNavItems.map((item, index) => (
              <NavLink
                  key={index}
              to={item.path}
              end={item.path === "/"}
              style={{ animationDelay: `${index * 0.1}s` }}
              className={({ isActive }) =>
                `flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group animate-nav-item active:scale-90 will-change-transform ${
                  isActive
                    ? "bg-violet-600 text-white shadow-xl shadow-violet-500/20 translate-x-1"
                    : `text-gray-600 dark:text-gray-400 ${darkMode ? "hover:bg-gray-800/80 hover:text-violet-400" : "hover:bg-violet-50 hover:text-violet-600"}`
                }`
              }
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-base font-semibold tracking-wide">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}
