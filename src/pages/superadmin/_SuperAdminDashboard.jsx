import React, { useEffect, useState } from "react";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { app } from "../../firebase/config"; 
import { useNavigate } from "react-router-dom";
import { FaBuilding, FaUserTie, FaSliders } from "react-icons/fa6";

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

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]   = useState({ orgs: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [time, setTime]     = useState(new Date());

  // Real-time Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch Stats from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Organizations Count
        const orgSnap  = await getDocs(collection(db, "organizations"));
        const orgCount = orgSnap.docs.length;

        // Fetch Platform Admins Count (role = admin only)
        // This counts only the admins managing households/orgs
        const userSnap = await getDocs(collection(db, "users"));
        const allUsers = userSnap.docs.map(d => d.data());
        const adminCount = allUsers.filter(u => u.role === "admin").length;

        setStats({
          orgs: orgCount,
          admins: adminCount,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formattedTime = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formattedDate = time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="p-6 sm:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
          
          {/* Header & Clock */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight">SuperAdmin Dashboard</h1>
              <p className="text-gray-500 mt-1">Platform overview and quick management access.</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-full md:w-auto md:min-w-[200px] text-center md:text-right">
              <p className="text-2xl sm:text-3xl font-bold text-violet-600 tabular-nums">{formattedTime}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">{formattedDate}</p>
            </div>
          </div>

          {/* Quick Access Clickable Cards */}
          {loading ? (
             <div className="text-center p-10 text-gray-400 font-medium animate-pulse">Loading system statistics...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Organization Shortcut */}
                <StatCard 
                    label="Active Admin" 
                    value={stats.orgs} 
                    icon={<FaBuilding />} 
                    color="bg-blue-100 text-blue-600" 
                    onClick={() => navigate('/organizations')}
                />

                {/* Platform Admins Shortcut */}
                <StatCard 
                    label="Platform Admins" 
                    value={stats.admins} 
                    icon={<FaUserTie />} 
                    color="bg-purple-100 text-purple-600" 
                    onClick={() => navigate('/system-users')}
                />

                {/* System Settings Shortcut */}
                <StatCard 
                    label="AI Core Settings" 
                    value="Active" // Dahil Settings ito, 'Active' ang magandang ilagay imbes na number
                    icon={<FaSliders />} 
                    color="bg-red-100 text-red-600" 
                    onClick={() => navigate('/system-settings')}
                />

            </div>
          )}

          {/* Optional: Pwede mong lagyan ng welcome message o extra info dito sa ibaba */}
          <div className="mt-10 bg-violet-600 rounded-3xl p-8 text-white shadow-xl shadow-violet-200 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative overflow-hidden">
              <div className="relative z-10">
                  <h2 className="text-2xl font-bold mb-2">System Health: Optimal</h2>
                  <p className="text-violet-200 max-w-lg leading-relaxed">
                      All AI detection models and background services are running smoothly. Click on any of the cards above to manage the platform.
                  </p>
              </div>
          </div>

      </div>
    </div>
  );
}