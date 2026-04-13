import React, { useState, useEffect } from "react";
import { FaSliders, FaVideo, FaShieldHalved, FaFloppyDisk } from "react-icons/fa6";
import { toast } from "react-toastify";

const SystemSettings = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // URL ng Flask AI Server mo
  const AI_API_URL = "http://localhost:5000/detection_settings"; 

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
        const response = await fetch(AI_API_URL);
        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Failed to fetch AI settings:", error);
        toast.error("Cannot connect to AI Server. Is it running?");
      } finally {
        setFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Ipapasa ang bagong settings sa Python Flask API
      const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success("AI Detection settings successfully updated!");
      } else {
        toast.error("Failed to update AI settings.");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings. Check API connection.");
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
        <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">System Settings</h1>
            <p className="text-gray-500 text-sm">SuperAdmin View: Configure real-time AI detection thresholds.</p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* Card 1: AI Confidence Thresholds */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <FaSliders className="text-lg" />
                    </div>
                    <h2 className="font-bold text-gray-800">Model Confidence (YOLO & LSTM)</h2>
                </div>
                <div className="p-6 space-y-6">
                    {/* General Pose Threshold */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-gray-700">General Pose Detection Accuracy</label>
                            <span className="text-sm font-bold text-violet-600">{Math.round(settings.pose_threshold * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            name="pose_threshold"
                            min="0.05" max="1.0" step="0.01"
                            value={settings.pose_threshold} 
                            onChange={handleChange}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600" 
                        />
                        <p className="text-xs text-gray-400 mt-2">Lower % detects more people but might cause false positives.</p>
                    </div>

                    {/* Stealing Threshold */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-gray-700">Stealing Detection Sensitivity</label>
                            <span className="text-sm font-bold text-violet-600">{Math.round(settings.steal_threshold * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            name="steal_threshold"
                            min="0.05" max="1.0" step="0.01"
                            value={settings.steal_threshold} 
                            onChange={handleChange}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600" 
                        />
                        <p className="text-xs text-gray-400 mt-2">Adjust how aggressive the AI flags stealing behaviors.</p>
                    </div>
                </div>
            </div>

            {/* Card 2: Time Limits & Logic */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <FaShieldHalved className="text-lg" />
                    </div>
                    <h2 className="font-bold text-gray-800">Behavior Time Limits</h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">Loitering Time Limit (Seconds)</label>
                            <input 
                                type="number" 
                                name="stillness_limit_seconds"
                                min="5"
                                value={settings.stillness_limit_seconds}
                                onChange={handleChange}
                                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-violet-500 transition-all font-semibold text-gray-700"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Seconds a person must be still before flagging.</p>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">Pacing Window (Seconds)</label>
                            <input 
                                type="number" 
                                name="history_seconds"
                                min="10"
                                value={settings.history_seconds}
                                onChange={handleChange}
                                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-violet-500 transition-all font-semibold text-gray-700"
                            />
                             <p className="text-[10px] text-gray-400 mt-1">Seconds tracked for pacing patterns.</p>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">Target Video FPS</label>
                            <input 
                                type="number" 
                                name="video_fps"
                                min="10" max="60"
                                value={settings.video_fps}
                                onChange={handleChange}
                                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-violet-500 transition-all font-semibold text-gray-700"
                            />
                             <p className="text-[10px] text-gray-400 mt-1">AI processing speed (Default: 30).</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:opacity-50"
                >
                    <FaFloppyDisk />
                    {loading ? "Updating AI Core..." : "Save System Settings"}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
};

export default SystemSettings;