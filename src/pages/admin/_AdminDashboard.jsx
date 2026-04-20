/* eslint-disable */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";
// IMPORT NATIN ANG getAllUsers PARA PUMAREHAS SA SYSTEM USERS
import { app } from "../../firebase/config";
import useAuth from "../../hooks/useAuth";
import { FaVideo, FaUserGroup, FaGear, FaShieldHalved } from "react-icons/fa6"; 

const db = getFirestore(app);

// Shared Component para sa Clickable Stats Card
const StatCard = ({ label, value, icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-3xl shadow-md border border-gray-100 p-6 flex flex-col items-start gap-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}
  >
    <div className={`p-4 rounded-2xl text-3xl ${color} group-hover:scale-110 transition-transform`}>
        {icon}
    </div>
    <div className="w-full">
      <p className="text-4xl font-extrabold text-gray-800">{value}</p>
      <div className="flex justify-between items-center mt-2">
        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">{label}</p>
        <span className="text-xs font-semibold text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
            Manage &rarr;
        </span>
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const { user: currentUser, orgId: myOrgId } = useAuth(); // Destructure myOrgId directly
  const navigate = useNavigate();
  const [time, setTime]       = useState(new Date());
  const [stats, setStats]     = useState({ cameras: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  // Real-time Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch stats from Firestore (Bulletproof Method)
  useEffect(() => {
    if (!currentUser || !myOrgId) {
        if (!loading && !myOrgId) setLoading(false);
        return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        // 1. QUERY USERS FOR THIS ORG ONLY
        const userQuery = query(
            collection(db, "users"), 
            where("org_id", "==", myOrgId)
        );
        const userSnap = await getDocs(userQuery);
        const orgUsers = userSnap.docs
            .map(d => d.data())
            .filter(u => u.role !== "superadmin");
        
        console.log("My Org ID:", myOrgId);
        console.log("Filtered Org Users:", orgUsers);

        // 2. QUERY CAMERAS FOR THIS ORG ONLY
        const camQuery = query(
            collection(db, "cameras"), 
            where("org_id", "==", myOrgId)
        );
        const camSnap = await getDocs(camQuery);
        const orgCameras = camSnap.docs.map(d => d.data());

        // 3. I-SET ANG STATS
        setStats({ 
            cameras: orgCameras.length, 
            users: orgUsers.length 
        });

      } catch (e) { 
        console.error("Dashboard Stats Error:", e); 
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [currentUser, myOrgId]);

  const formattedTime = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formattedDate = time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="p-6 sm:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
          
          {/* Header & Clock */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight">Admin Dashboard</h1>
              <p className="text-gray-500 mt-1">Manage your organization's cameras and users.</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-full md:w-auto md:min-w-[200px] text-center md:text-right">
              <p className="text-2xl sm:text-3xl font-bold text-violet-600 tabular-nums">{formattedTime}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">{formattedDate}</p>
            </div>
          </div>

          {/* Quick Access Clickable Cards */}
          {loading ? (
             <div className="text-center p-10 text-gray-400 font-medium animate-pulse">Loading organization data...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    label="Registered Cameras" 
                    value={stats.cameras} 
                    icon={<FaVideo />} 
                    color="bg-blue-100 text-blue-600" 
                    onClick={() => navigate('/camera-admin')}
                />
                <StatCard 
                    label="System Users" 
                    value={stats.users} 
                    icon={<FaUserGroup />} 
                    color="bg-purple-100 text-purple-600" 
                    onClick={() => navigate('/system-users')}
                />
                <StatCard 
                    label="Account Settings" 
                    value="Active"
                    icon={<FaGear />} 
                    color="bg-gray-200 text-gray-700" 
                    onClick={() => navigate('/settings')}
                />
            </div>
          )}

          {/* Info Banner */}
          <div className="mt-10 bg-violet-600 rounded-3xl p-8 text-white shadow-xl shadow-violet-200 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-hidden">
              <div className="relative z-10">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><FaShieldHalved /> Administration Mode</h2>
                  <p className="text-violet-200 max-w-2xl leading-relaxed">
                      As an administrator, you have full control over the household's camera configurations and authorized users. 
                      Live monitoring and alert notifications are solely dedicated to standard user accounts.
                  </p>
              </div>
          </div>

      </div>
    </div>
  );
}