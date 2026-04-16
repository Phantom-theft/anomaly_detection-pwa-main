import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { IoSettingsSharp } from "react-icons/io5";
import { FaSave, FaUndo } from "react-icons/fa";

const defaultSettings = {
  video_fps:               30,
  loiter_area_w:           0.35,
  loiter_area_h:           0.35,
  steal_threshold:         0.20,
  pose_threshold:          0.18,
  history_seconds:         10,
  scan_threshold:          5,
  stillness_limit_seconds: 20,
  dist_speed_threshold:    8.0,
  pacing_path_mult:        1.0,
};

// Naka-grupo ayon sa iyong request
const settingsGroups = [
  {
    groupName: "Video Playback Control (Global)",
    items: [
      { key: "video_fps", label: "Video FPS Limit (Frames/Sec)", desc: "Lower this if YouTube videos play in fast-forward (e.g. 15-20).", min: 5, max: 60, step: 1 }
    ]
  },
  {
    groupName: "Area Settings (Height & Width)",
    items: [
      { key: "loiter_area_w", label: "Area Width (%)", desc: "Max width to detect Loitering/Pacing.", min: 0.05, max: 0.9, step: 0.05, isPercent: true },
      { key: "loiter_area_h", label: "Area Height (%)", desc: "Max height to detect Loitering/Pacing.", min: 0.05, max: 0.9, step: 0.05, isPercent: true }
    ]
  },
  {
    groupName: "Stealing & Pose Detection",
    items: [
      { key: "steal_threshold", label: "Stealing Confidence Threshold", desc: "Lower = more sensitive to stealing motions.", min: 0.05, max: 0.95, step: 0.01 },
      { key: "pose_threshold", label: "Pose Anomaly Threshold", desc: "Lower = more sensitive to weird body positions.", min: 0.05, max: 0.8, step: 0.01 }
    ]
  },
  {
    groupName: "Loitering, Pacing & Scanning",
    items: [
      { key: "history_seconds", label: "Movement History (Seconds)", desc: "Time tracking for Pacing & Loitering.", min: 5, max: 60, step: 1 },
      { key: "scan_threshold", label: "Scanning Sensitivity (Frames)", desc: "Lower = faster head-turning detection.", min: 2, max: 15, step: 1 },
      { key: "stillness_limit_seconds", label: "Absolute Stillness Time (Seconds)", desc: "Time required standing perfectly still to trigger Loitering.", min: 3, max: 120, step: 1 },
      { key: "pacing_path_mult", label: "Pacing Distance Multiplier", desc: "Distance needed to trigger pacing.", min: 0.5, max: 5.0, step: 0.1 }
    ]
  }
];

const _DetectionSettings = () => {
  const [settings, setSettings]   = useState(defaultSettings);
  const [original, setOriginal]   = useState(defaultSettings);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
  let cleanUrl = rawApiUrl.replace(/\/+$/, "");
  if (cleanUrl.includes("ngrok-free.dev")) cleanUrl = cleanUrl.replace(":5000", "");
  if (window.location.protocol === "https:" && cleanUrl.includes("ngrok-free.dev")) cleanUrl = cleanUrl.replace("http://", "https://");
  
  const SERVER_URL = cleanUrl;
  const ngrokHeader = { headers: { "ngrok-skip-browser-warning": "69420" } };

  // ... inside the component ...
    useEffect(() => {
      const fetchSettings = async () => {
        try {
          const res = await axios.get(`${SERVER_URL}/detection_settings`, ngrokHeader);
          setSettings(res.data);
          setOriginal(res.data);
        } catch (err) {
          console.error("Detection Settings Fetch Error:", err);
          toast.error(`Backend is offline or unreachable: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchSettings();
    }, []);

    const handleChange = (key, value) => {
      const updated = { ...settings, [key]: parseFloat(value) };
      setSettings(updated);
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(original));
    };

    const handleSave = async () => {
      setSaving(true);
      try {
        await axios.post(`${SERVER_URL}/detection_settings`, settings, ngrokHeader);
        toast.success("Settings saved successfully! Changes applied to AI instantly.");
        setOriginal(settings);
        setHasChanges(false);
      } catch (err) {
        console.error("Detection Settings Save Error:", err);
        toast.error(`Failed to save settings: ${err.message}`);
      } finally {
        setSaving(false);
      }
    };
  const handleReset = () => {
    setSettings(original);
    setHasChanges(false);
    toast.info("Changes discarded.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400 animate-pulse text-sm">Loading detection settings...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-violet-100 rounded-xl text-violet-600">
            <IoSettingsSharp className="text-3xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Detection Settings</h1>
            <p className="text-gray-500 text-sm">Adjust AI behavior thresholds directly from your dashboard.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 mb-8">
          {settingsGroups.map((group, gIdx) => (
            <div key={gIdx} className="mb-10 last:mb-0">
              <h2 className="text-lg font-bold text-violet-800 mb-6 border-b pb-2">{group.groupName}</h2>
              <div className="flex flex-col gap-8">
                {group.items.map((meta) => (
                  <div key={meta.key} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-700">{meta.label}</label>
                      <span className="text-sm font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full font-mono">
                        {meta.isPercent ? `${(settings[meta.key] * 100).toFixed(0)}%` : settings[meta.key]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={meta.min} max={meta.max} step={meta.step}
                      value={settings[meta.key]}
                      onChange={(e) => handleChange(meta.key, e.target.value)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                      <span>{meta.isPercent ? `${(meta.min * 100).toFixed(0)}%` : meta.min}</span>
                      <span className="text-center text-gray-400 text-[10px] italic">{meta.desc}</span>
                      <span>{meta.isPercent ? `${(meta.max * 100).toFixed(0)}%` : meta.max}</span>
                    </div>
                    {settings[meta.key] !== original[meta.key] && (
                      <p className="text-[10px] text-orange-500 font-mono">Changed from {meta.isPercent ? `${(original[meta.key] * 100).toFixed(0)}%` : original[meta.key]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-10 border-t pt-6">
            <button onClick={handleSave} disabled={saving || !hasChanges}
              className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2
                ${saving || !hasChanges ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-700 text-white shadow-lg"}`}>
              <FaSave /> {saving ? "Saving..." : "Save Settings"}
            </button>
            <button onClick={handleReset} disabled={!hasChanges}
              className={`px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2
                ${!hasChanges ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>
              <FaUndo /> Discard
            </button>
          </div>
          {hasChanges && <p className="text-center text-xs text-orange-500 mt-3 font-mono animate-pulse">⚠️ You have unsaved changes</p>}
        </div>
      </div>
    </div>
  );
};

export default _DetectionSettings;