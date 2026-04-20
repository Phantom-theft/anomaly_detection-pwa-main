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
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-violet-600 rounded-2xl text-white shadow-lg shadow-violet-200">
            <FaCamera className="text-3xl" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Organization Camera Directory</h1>
            <p className="text-gray-500 font-medium mt-1">
                View-only access to surveillance devices for <span className="text-violet-600 font-bold">{orgId || "your organization"}</span>.
            </p>
          </div>
        </div>

        {/* Camera List Container */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-10">
          <div className="flex items-center justify-between mb-8 gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-3">
                <FaVideo className="text-violet-500" /> Authorized Devices
            </h2>
            <span className="bg-violet-100 text-violet-700 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap">
                {cameraList.length} Connected
            </span>
          </div>

          {loading ? (
            <div className="text-center py-20">
                <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Synchronizing feeds...</p>
            </div>
          ) : cameraList.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
              <FaCamera className="text-6xl mx-auto mb-4 text-gray-200" />
              <p className="text-gray-500 font-bold">No cameras registered to this organization.</p>
              <p className="text-gray-400 text-sm mt-1">Please contact your Household Admin to add devices.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {cameraList.map((cam) => (
                <div key={cam.name} className="flex items-center justify-between p-6 rounded-[1.5rem] border border-gray-100 bg-white hover:border-violet-200 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner
                            ${cam.online ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                            {cam.type === "youtube" ? <FaYoutube /> : <FaCamera />}
                        </div>
                        <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm
                            ${cam.online ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-800 uppercase tracking-wider text-sm">{cam.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase
                            ${cam.type === "youtube" ? "bg-red-100 text-red-600" : "bg-violet-100 text-violet-600"}`}>
                            {cam.type}
                        </span>
                        <p className="text-[11px] text-gray-400 font-mono font-bold truncate max-w-[200px] md:max-w-md">{cam.src}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className={`text-[10px] font-black uppercase tracking-widest
                            ${cam.online ? "text-green-600" : "text-red-600"}`}>
                            {cam.online ? "System Active" : "Link Interrupted"}
                        </span>
                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Real-time status</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-8 p-6 bg-violet-50 rounded-[2rem] border border-violet-100 flex items-start gap-4">
            <div className="bg-violet-600 text-white p-2 rounded-lg text-sm">
                <FaCircle className="animate-pulse" />
            </div>
            <p className="text-violet-800 text-sm font-medium leading-relaxed italic">
                <strong>Security Note:</strong> You are viewing cameras specifically authorized for <strong>Org ID: {orgId}</strong>. 
                Individual stream management and deletion are restricted to the primary Household Administrator.
            </p>
        </div>

      </div>
    </div>
  );
};

export default _CameraAdmin;
