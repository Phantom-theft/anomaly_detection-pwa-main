/* eslint-disable */
import React, { useState, useEffect } from "react";
import { FaSliders, FaVideo, FaShieldHalved, FaFloppyDisk } from "react-icons/fa6";
import { Sun, Moon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme, selectTheme } from "../../store/slices/uiSlice";
import { toast } from "react-toastify";

const SystemSettings = () => {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const darkMode = theme === 'dark';
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // URL ng Flask AI Server mo
  const rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
  let cleanUrl = rawApiUrl.replace(/\/+$/, "");
  if (cleanUrl.includes("ngrok-free.dev")) cleanUrl = cleanUrl.replace(":5000", "");
  if (window.location.protocol === "https:" && cleanUrl.includes("ngrok-free.dev")) cleanUrl = cleanUrl.replace("http://", "https://");
  
  const BASE_URL = cleanUrl;
  const AI_API_URL = `${BASE_URL}/detection_settings`; 

  // Default state na naka-map sa Python variables mo
  const [settings, setSettings] = useState({
    pose_threshold: 0.18,
    steal_threshold: 0.20,
    stillness_limit_seconds: 20,
    history_seconds: 20,
    video_fps: 30.0
  });

  // Kukunin ang current settings mula sa Python AI server pagka-load ng page
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(AI_API_URL, {
          headers: { "ngrok-skip-browser-warning": "69420" }
        });
        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({ ...prev, ...data }));
        } else {
          const errData = await response.json();
          throw new Error(errData.message || `Server error: ${response.status}`);
        }
      } catch (error) {
        console.error("Failed to fetch AI settings:", error);
        toast.error(`Cannot connect to AI Server: ${error.message}`);
      } finally {
        setFetching(false);
      }
    };

    fetchSettings();
  }, [AI_API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420"
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("AI Settings updated successfully!");
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update settings.");
      }
    } catch (error) {
      console.error("Save settings error:", error);
      toast.error(`Error saving settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
      return <div className="p-10 text-center text-gray-500 font-bold">Connecting to AI Engine...</div>;
  }

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                  <FaShieldHalved className="text-violet-600" /> Platform AI Configuration
              </h1>
              <p className="text-gray-500 mt-1 font-medium italic">Adjust the sensitivity and detection parameters of the behavioral core.</p>
            </div>
            <button 
              type="button"
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={24} className="text-amber-500" /> : <Moon size={24} className="text-gray-500" />}
            </button>
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Sensitivity Settings */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaSliders className="text-violet-500" /> Behavior Sensitivity
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold uppercase text-gray-400">Pose Anomaly (Lower = Strict)</label>
                            <span className="text-sm font-bold text-violet-600">{settings.pose_threshold}</span>
                        </div>
                        <input type="range" name="pose_threshold" min="0.05" max="0.5" step="0.01" value={settings.pose_threshold} onChange={handleChange}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-violet-600" />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold uppercase text-gray-400">Stealing Confidence (Lower = Strict)</label>
                            <span className="text-sm font-bold text-violet-600">{settings.steal_threshold}</span>
                        </div>
                        <input type="range" name="steal_threshold" min="0.05" max="0.5" step="0.01" value={settings.steal_threshold} onChange={handleChange}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-violet-600" />
                    </div>
                </div>
            </div>

            {/* Right: Temporal Settings */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaSliders className="text-violet-500" /> Temporal Logic
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold uppercase text-gray-400">Stillness Limit (Seconds)</label>
                            <span className="text-sm font-bold text-violet-600">{settings.stillness_limit_seconds}s</span>
                        </div>
                        <input type="range" name="stillness_limit_seconds" min="3" max="60" step="1" value={settings.stillness_limit_seconds} onChange={handleChange}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-violet-600" />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold uppercase text-gray-400">Tracking Buffer (Seconds)</label>
                            <span className="text-sm font-bold text-violet-600">{settings.history_seconds}s</span>
                        </div>
                        <input type="range" name="history_seconds" min="5" max="60" step="1" value={settings.history_seconds} onChange={handleChange}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-violet-600" />
                    </div>
                </div>
            </div>

            {/* Bottom: Hardware/Perf */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:col-span-2">
                 <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaVideo className="text-violet-500" /> Engine Performance
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold uppercase text-gray-400">Processing FPS Limit</label>
                            <span className="text-sm font-bold text-violet-600">{settings.video_fps} FPS</span>
                        </div>
                        <input type="range" name="video_fps" min="1" max="60" step="1" value={settings.video_fps} onChange={handleChange}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-violet-600" />
                        <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tight">
                            Lowering FPS can reduce server CPU load significantly.
                        </p>
                    </div>

                    <div className="flex items-center justify-end">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-violet-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <FaFloppyDisk /> {loading ? "Updating AI Core..." : "Apply Global Settings"}
                        </button>
                    </div>
                </div>
            </div>

        </form>

        {/* Warning Note */}
        <div className="mt-8 p-6 bg-orange-50 rounded-[2rem] border border-orange-100">
            <p className="text-orange-700 text-sm font-medium leading-relaxed italic">
                <strong>Important:</strong> Changes to AI Configuration take effect immediately for all organizations. 
                Extreme sensitivity values may cause higher false-positives across the network.
            </p>
        </div>

      </div>
    </div>
  );
};

export default SystemSettings; 