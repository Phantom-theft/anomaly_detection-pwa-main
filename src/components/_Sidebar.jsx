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

    // ── SUPER ADMIN ──────────────────────────────────────
    {
      name:  "Dashboard",
      path:  "/",
      icon:  <TbLayoutDashboardFilled className="text-2xl" />,
      roles: ["superadmin"],
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

    // ── ADMIN ─────────────────────────────────────────────
    // INALIS NA ANG "ALERT" DITO PARA SA ADMIN
    {
      name:  "Dashboard",
      path:  "/",
      icon:  <TbLayoutDashboardFilled className="text-2xl" />,
      roles: ["admin"],
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
      roles: ["admin"],
    },

    // ── USER ──────────────────────────────────────────────
    // NANATILI ANG LIVE VIEW AT ALERTS DITO
    {
      name:  "Dashboard",
      path:  "/",
      icon:  <TbLayoutDashboardFilled className="text-2xl" />,
      roles: ["user"],
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
    {
      name:  "Settings",
      path:  "/settings",
      icon:  <IoSettingsSharp className="text-2xl" />,
      roles: ["user"],
    },
  ];

  const filteredNavItems = allNavItems.filter(item => item.roles.includes(role));

  // Role badge color
  const roleBadge = {
    superadmin: { label: "Super Admin", color: "bg-yellow-100 text-yellow-700" },
    admin:      { label: "Admin",       color: "bg-violet-100 text-violet-700" },
    user:       { label: "User",        color: "bg-blue-100 text-blue-600" },
  }[role] || { label: role, color: "bg-gray-100 text-gray-500" };

  return (
    <div className={`fixed bg-white dark:bg-gray-900 w-64 h-screen shadow-2xl transition-colors duration-300
      ${sidebar ? "translate-x-0" : "-translate-x-64"} 
      lg:translate-x-0 lg:static z-50 transition-transform flex flex-col border-r border-gray-100 dark:border-gray-800`}>

      {/* Header */}
      <div className="p-6 flex flex-col items-center border-b border-gray-100 dark:border-gray-800 gap-4">
        <div className="w-full flex justify-between items-center">
          <img src={logo} alt="Logo"
            className="h-14 w-14 rounded-full shadow-md border-2 border-violet-100 dark:border-violet-900/30" />
          <button className="lg:hidden p-2 bg-gray-100 dark:bg-gray-800 rounded-full" onClick={() => setSidebar(false)}>
            <FaAngleRight className="text-gray-600 dark:text-gray-400 text-xl" />
          </button>
        </div>
        <div className="w-full">
          <h1 className="font-extrabold text-xl leading-tight text-gray-800 dark:text-white">
            Anomaly <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
              Detection System
            </span>
          </h1>
          {/* Role badge */}
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
            className={({ isActive }) =>
              `flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-200 group ${
                isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/20"
                  : `text-gray-600 dark:text-gray-400 ${darkMode ? "hover:bg-gray-800 hover:text-violet-400" : "hover:bg-violet-50 hover:text-violet-600"}`
              }`
            }
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-base font-semibold tracking-wide">{item.name}</span>
          </NavLink>
        ))}
      </div>

    </div>
  );
}