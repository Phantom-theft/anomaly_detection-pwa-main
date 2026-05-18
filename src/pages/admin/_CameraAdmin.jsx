import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { FaVideo, FaCamera, FaYoutube, FaCircle } from "react-icons/fa6";
import { app } from "../../firebase/config";

const rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
let cleanUrl = rawApiUrl.replace(/\/+$/, "");
if (cleanUrl.includes("ngrok-free.dev")) cleanUrl = cleanUrl.replace(":5000", "");
if (window.location.protocol === "https:" && cleanUrl.includes("ngrok-free.dev")) cleanUrl = cleanUrl.replace("http://", "https://");

const SERVER_URL = cleanUrl;
const db = getFirestore(app);

const _CameraAdmin = () => {
  const [cameraList, setCameraList]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [orgId, setOrgId]             = useState(null);

  // --- Kunin ang org_id ng current user ---
  useEffect(() => {
    const fetchOrgId = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setOrgId(userDoc.data().org_id || null);
        }
      } catch (err) {
        console.error("Error fetching org_id:", err);
      }
    };
    fetchOrgId();
  }, []);

  // --- Fetch camera list every 5 seconds ---
  useEffect(() => {
    if (!orgId) return; // Wait for orgId before fetching

    const fetchCameras = async () => {
      try {
        // Strict filtering by org_id
        const url = `${SERVER_URL}/cameras?org_id=${orgId}`;
        const res = await axios.get(url, {
          headers: { "ngrok-skip-browser-warning": "69420" }
        });
        setCameraList(res.data.cameras || []);
      } catch (err) {
        console.error("Camera Admin Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCameras();
    const interval = setInterval(fetchCameras, 5000);
    return () => clearInterval(interval);
  }, [orgId]);

  return (
    <div className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8 sm:mb-10">
          <div className="p-3 sm:p-4 bg-violet-600 rounded-2xl text-white shadow-lg shadow-violet-200 flex-shrink-0">
            <FaCamera className="text-2xl sm:text-3xl" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">Camera Directory</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 text-sm sm:text-base leading-tight">
                View-only access for <span className="text-violet-600 dark:text-violet-400 font-bold break-all">{orgId || "your organization"}</span>.
            </p>
          </div>
        </div>

        {/* Camera List Container */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl sm:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 p-5 sm:p-10 transition-colors">
          <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 sm:gap-3 min-w-0">
                <FaVideo className="text-violet-500 flex-shrink-0" /> 
                <span className="truncate">Authorized Devices</span>
            </h2>
            <span className="flex-shrink-0 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold text-[9px] sm:text-xs uppercase tracking-widest whitespace-nowrap">
                {cameraList.length} Connected
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16 sm:py-20">
                <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] sm:text-xs tracking-widest">Synchronizing feeds...</p>
            </div>
          ) : cameraList.length === 0 ? (
            <div className="text-center py-16 sm:py-20 bg-gray-50 dark:bg-gray-900/30 rounded-2xl sm:rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
              <FaCamera className="text-5xl sm:text-6xl mx-auto mb-4 text-gray-200 dark:text-gray-800" />
              <p className="text-gray-500 dark:text-gray-400 font-bold text-sm sm:text-base px-4">No cameras registered.</p>
              <p className="text-gray-400 dark:text-gray-600 text-xs sm:text-sm mt-1 px-4">Contact your Household Admin to add devices.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {cameraList.map((cam) => (
                <div key={cam.name} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 rounded-2xl sm:rounded-[1.5rem] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-200 dark:hover:border-violet-500 hover:shadow-md transition-all duration-300 group gap-4">
                  <div className="flex items-center gap-3 sm:gap-5 w-full">
                    <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl shadow-inner
                            ${cam.online ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"}`}>
                            {cam.type === "youtube" ? <FaYoutube /> : <FaCamera />}
                        </div>
                        <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-sm
                            ${cam.online ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider text-xs sm:text-sm truncate">{cam.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md font-black uppercase flex-shrink-0
                            ${cam.type === "youtube" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"}`}>
                            {cam.type}
                        </span>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 font-mono font-bold truncate" title={cam.src}>{cam.src}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 dark:border-gray-700">
                    <div className="flex flex-col items-start sm:items-end">
                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest
                            ${cam.online ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {cam.online ? "System Active" : "Link Interrupted"}
                        </span>
                        <p className="text-[8px] sm:text-[9px] text-gray-400 dark:text-gray-600 font-bold uppercase mt-0.5">Real-time status</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-8 p-5 sm:p-6 bg-violet-50 dark:bg-violet-900/10 rounded-2xl sm:rounded-[2rem] border border-violet-100 dark:border-violet-800 flex items-start gap-3 sm:gap-4">
            <div className="bg-violet-600 text-white p-2 rounded-lg text-xs sm:text-sm flex-shrink-0">
                <FaCircle className="animate-pulse" />
            </div>
            <p className="text-violet-800 dark:text-violet-300 text-xs sm:text-sm font-medium leading-relaxed italic">
                <strong>Security Note:</strong> viewing cameras for <strong>Org ID: <span className="break-all">{orgId}</span></strong>. 
                Management restricted to Primary Admin.
            </p>
        </div>

      </div>
    </div>
  );
};

export default _CameraAdmin;
