import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { FaVideo, FaPlus, FaLink, FaCamera, FaTrash, FaYoutube } from "react-icons/fa6";
import { toast } from "react-toastify";
import { app } from "../firebase/config";
import useAuth from "../hooks/useAuth";

const rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
// 1. Remove trailing slash
let cleanUrl = rawApiUrl.replace(/\/+$/, "");
// 2. Remove :5000 if it's an ngrok link (safety)
if (cleanUrl.includes("ngrok-free.dev")) {
  cleanUrl = cleanUrl.replace(":5000", "");
}
// 3. Force HTTPS if we are on an HTTPS site and using ngrok
if (window.location.protocol === "https:" && cleanUrl.includes("ngrok-free.dev")) {
  cleanUrl = cleanUrl.replace("http://", "https://");
}
const SERVER_URL = cleanUrl;
const db = getFirestore(app);

const _Camera = () => {
  const { user, role, organization: orgId } = useAuth(); // Use useAuth for central state
  const [activeTab, setActiveTab]       = useState("rtsp");
  const [cameraName, setCameraName]     = useState("");
  const [rtspUrl, setRtspUrl]           = useState("");
  const [youtubeUrl, setYoutubeUrl]     = useState("");
  const [loading, setLoading]           = useState(false);
  const [addedCameras, setAddedCameras] = useState([]); 

  // --- Fetch cameras from Backend ---
  const fetchCameras = async () => {
    if (!orgId) return;
    try {
      const res = await axios.get(`${SERVER_URL}/cameras?org_id=${orgId}`, {
        headers: { "ngrok-skip-browser-warning": "69420" }
      });
      if (res.data && res.data.cameras) {
        setAddedCameras(res.data.cameras);
      }
    } catch (err) {
      console.error("Error fetching cameras:", err);
    }
  };

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 5000); // Poll for status updates.
    return () => clearInterval(interval);
  }, [orgId]);

  // --- RTSP Handler ---
  const handleAddCamera = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!user) { toast.error("You must be logged in to add a camera."); setLoading(false); return; }
    const isValidRtsp = (url) => url.startsWith("rtsp://");
    if (!isValidRtsp(rtspUrl)) { toast.error("Invalid RTSP URL format. It must start with 'rtsp://'."); setLoading(false); return; }
    try {
      const auth = getAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("Firebase session not found");
      
      const token = await firebaseUser.getIdToken();
      await axios.post(`${SERVER_URL}/addCamera`, { 
        userId: firebaseUser.uid, 
        cameraName, 
        rtspUrl,
        org_id: orgId || "default"
      }, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420"
        } 
      });
      toast.success(`Camera '${cameraName}' added successfully!`);
      setCameraName(""); setRtspUrl("");
      fetchCameras();
    } catch (error) {
      console.error("Add Camera Error:", error);
      if (error.response?.status === 400) { toast.warn(error.response.data?.error || "Invalid request"); }
      else if (!error.response) { toast.error(`Backend is offline or unreachable: ${error.message}`); }
      else { toast.error(`Server error: ${error.message}`); }
    } finally { setLoading(false); }
  };

  // --- YouTube Handler ---
  const handleAddYoutube = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!user) { toast.error("You must be logged in to add a camera."); setLoading(false); return; }
    const isValidYoutube = (url) =>
      url.includes("youtube.com/watch") || url.includes("youtu.be/") || url.includes("youtube.com/live");
    if (!isValidYoutube(youtubeUrl)) { toast.error("Invalid YouTube URL."); setLoading(false); return; }
    try {
      const auth = getAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("Firebase session not found");
      
      const token = await firebaseUser.getIdToken();
      toast.info("Fetching YouTube stream... please wait.", { autoClose: 8000 });
      await axios.post(`${SERVER_URL}/add_youtube`, { 
        userId: firebaseUser.uid, 
        cameraName, 
        youtubeUrl,
        org_id: orgId || "default"
      }, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420"
        } 
      });
      toast.success(`YouTube stream '${cameraName}' added successfully!`);
      setCameraName(""); setYoutubeUrl("");
      fetchCameras();
    } catch (error) {
      console.error("Add YouTube Error:", error);
      if (error.response?.status === 400) { toast.warn(error.response.data?.error || "Invalid request"); }
      else if (error.response?.status === 500) { toast.error(error.response.data?.error || "Server error fetching YouTube stream."); }
      else if (!error.response) { toast.error(`Backend is offline or unreachable: ${error.message}`); }
      else { toast.error(`Server error: ${error.message}`); }
    } finally { setLoading(false); }
  };

  const handleRemove = async (name) => {
    if (!window.confirm(`Are you sure you want to delete camera '${name}'?`)) return;
    try {
        await axios.delete(`${SERVER_URL}/delete_camera/${name}`, {
          headers: { "ngrok-skip-browser-warning": "69420" }
        });
        toast.success("Camera removed");
        fetchCameras();
    } catch (err) {
        console.error("Delete Camera Error:", err);
        toast.error("Failed to delete camera.");
    }
  };

  // Helper to check delete permission
  const canDelete = (cam) => {
    if (role === 'admin' || role === 'superadmin') return true;
    return cam.owner === user?.uid;
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-violet-100 rounded-xl text-violet-600">
            <FaCamera className="text-3xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Camera Configuration</h1>
            <p className="text-gray-500 text-sm">Add new surveillance devices for anomaly detection.</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-3xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 mb-8 transition-colors">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <FaPlus className="text-violet-600 text-lg" /> Connect New Camera
          </h2>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-950 border border-transparent dark:border-gray-800 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => { setActiveTab("rtsp"); setCameraName(""); setRtspUrl(""); setYoutubeUrl(""); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition duration-200
                ${activeTab === "rtsp" 
                  ? "bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-400 shadow-md border border-gray-200 dark:border-gray-700" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              <FaCamera className="text-xs" /> RTSP Camera
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("youtube"); setCameraName(""); setRtspUrl(""); setYoutubeUrl(""); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition duration-200
                ${activeTab === "youtube" 
                  ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-md border border-gray-200 dark:border-gray-700" 
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              <FaYoutube className="text-xs" /> YouTube Stream
            </button>
          </div>

          {/* RTSP Form */}
          {activeTab === "rtsp" && (
            <form onSubmit={handleAddCamera} className="flex flex-col gap-5">
              <div>
                <label htmlFor="cameraName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FaVideo className="inline mr-1 text-xs text-gray-400" /> Camera Name
                </label>
                <input
                  id="cameraName" type="text" placeholder="Living Room Camera"
                  className="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition duration-150 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                  value={cameraName} onChange={(e) => setCameraName(e.target.value)} required
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="rtspUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FaLink className="inline mr-1 text-xs text-gray-400" /> RTSP Stream URL
                </label>
                <input
                  id="rtspUrl" type="text" placeholder="rtsp://user:password@ip_address:port/stream"
                  className="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition duration-150 font-mono text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                  value={rtspUrl} onChange={(e) => setRtspUrl(e.target.value)} required
                  autoComplete="off"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Ensure the URL starts with <code className="bg-gray-100 dark:bg-gray-800 p-1 rounded font-mono">rtsp://</code> and includes authentication if required.
                </p>
              </div>
              <button type="submit" disabled={loading}
                className={`mt-4 w-full py-3 rounded-xl font-bold transition duration-300 ease-in-out flex items-center justify-center gap-2
                  ${loading ? "bg-violet-400 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-700 text-white shadow-lg"}`}
              >
                <FaPlus /> {loading ? "Connecting Camera..." : "Add Camera"}
              </button>
            </form>
          )}

          {/* YouTube Form */}
          {activeTab === "youtube" && (
            <form onSubmit={handleAddYoutube} className="flex flex-col gap-5">
              <div>
                <label htmlFor="ytCameraName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FaVideo className="inline mr-1 text-xs text-gray-400" /> Camera Name
                </label>
                <input
                  id="ytCameraName" type="text" placeholder="YouTube CCTV Feed"
                  className="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition duration-150 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                  value={cameraName} onChange={(e) => setCameraName(e.target.value)} required
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FaYoutube className="inline mr-1 text-xs text-red-400" /> YouTube URL
                </label>
                <input
                  id="youtubeUrl" type="text" placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition duration-150 font-mono text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                  value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} required
                  autoComplete="off"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Supports YouTube videos and live streams.
                </p>
              </div>
              <button type="submit" disabled={loading}
                className={`mt-4 w-full py-3 rounded-xl font-bold transition duration-300 ease-in-out flex items-center justify-center gap-2
                  ${loading ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white shadow-lg"}`}
              >
                <FaYoutube /> {loading ? "Fetching Stream..." : "Add YouTube Stream"}
              </button>
            </form>
          )}
        </div>

        {/* Live Streams */}
        {addedCameras.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
              <FaVideo className="text-violet-600" />
              Live Streams
              <span className="ml-1 text-xs bg-violet-100 text-violet-600 px-2 py-1 rounded-full font-bold">
                {addedCameras.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addedCameras.map((cam) => (
                <div key={cam.name} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cam.online ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                      <span className="font-bold text-gray-700 text-sm uppercase tracking-wider">{cam.name}</span>
                      {cam.type === "youtube" && (
                        <span className="text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <FaYoutube /> YT
                        </span>
                      )}
                      {cam.owner === user?.uid && (
                        <span className="text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold">
                          OWNER
                        </span>
                      )}
                    </div>
                    {canDelete(cam) && (
                      <button onClick={() => handleRemove(cam.name)}
                        className="text-gray-300 hover:text-red-500 transition p-1 rounded-lg hover:bg-red-50">
                        <FaTrash className="text-sm" />
                      </button>
                    )}
                  </div>

                  {/* MJPEG Stream — direkta mula sa backend */}
                  <img
                    src={`${SERVER_URL}/video/${cam.name}?t=${Date.now()}`}
                    alt={`Camera ${cam.name}`}
                    className="w-full"
                    style={{ height: "220px", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/640x360?text=Stream+Loading...";
                    }}
                  />

                  <div className="px-5 py-2 bg-gray-50 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-mono">
                      MJPEG Stream · {cam.type === "youtube" ? "YouTube Source" : "RTSP Source"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {addedCameras.length === 0 && (
          <div className="text-center py-16 text-gray-300">
            <FaVideo className="text-5xl mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">No active streams</p>
            <p className="text-xs mt-1 text-gray-400">Add a camera above to start live monitoring.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default _Camera;