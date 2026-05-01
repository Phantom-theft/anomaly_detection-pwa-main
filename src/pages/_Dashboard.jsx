/* eslint-disable */
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, doc, getDoc, onSnapshot, orderBy, limit, getFirestore } from "firebase/firestore";
import { app } from "../firebase/config";
import useAuth from "../hooks/useAuth";
import { useRealTimeDashboard } from "../hooks/useRealTimeAlerts";
import { useSelector } from "react-redux";
import { selectTheme } from "../store/slices/uiSlice";
import { Trash2, Info } from "lucide-react"; // 🚨 DAGDAG: Info Icon
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal"; // 🚨 DAGDAG: ConfirmModal import

const rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
let cleanUrl = rawApiUrl.replace(/\/+$/, "");
if (cleanUrl.includes("ngrok-free.dev")) cleanUrl = cleanUrl.replace(":5000", "");
if (window.location.protocol === "https:" && cleanUrl.includes("ngrok-free.dev")) cleanUrl = cleanUrl.replace("http://", "https://");

const SERVER_URL = cleanUrl;
const db = getFirestore(app);

// ============================================================
// SVG ICONS
// ============================================================
const IconVideo = ({ className }) => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" className={className} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M336.2 64H47.8C21.4 64 0 85.4 0 111.8v288.4C0 426.6 21.4 448 47.8 448h288.4c26.4 0 47.8-21.4 47.8-47.8V111.8c0-26.4-21.4-47.8-47.8-47.8zm189.4 37.7L416 177.3v157.4l109.6 75.5c21.2 14.6 50.4-.3 50.4-25.8V127.5c0-25.5-29.2-40.4-50.4-25.8z"></path></svg>);
const IconExclamation = ({ className }) => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" className={className} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-14.912 0-27 12.088-27 27s12.088 27 27 27 27-12.088 27-27-12.088-27-27-27zm-.611-190l-8.41 128c-.815 12.39 9.079 23 21.465 23h23.112c12.386 0 22.28-10.61 21.465-23l-8.41-128c-.765-11.625-10.403-21-22.057-21h-25.148c-11.654 0-21.292 9.375-22.057 21z"></path></svg>);
const IconVolume = ({ isMuted, className }) => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" className={className} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">{isMuted ? (<path d="M150.7 136.1C137.4 141.2 128 154.5 128 169.6v172.8c0 15.1 9.4 28.4 22.7 33.5s28.1 1 38.6-10.4l91.4-98.8H352c17.7 0 32-14.3 32-32V176c0-17.7-14.3-32-32-32H280.7l-91.4-98.8c-10.5-11.4-25.3-15.5-38.6-10.4zM432 256c0-53.5-24.8-101.1-63.1-131.7c-5.9-4.7-14.5-3.8-19.2 2.1s-3.8 14.5 2.1 19.2C384.4 172.5 400 212.4 400 256s-15.6 83.5-48.2 109.4c-5.9 4.7-6.8 13.3-2.1 19.2s13.3 6.8 19.2 2.1c38.3-30.6 63.1-78.2 63.1-131.7z" />) : (<path d="M215.03 71.05L126.06 160H24c-13.26 0-24 10.74-24 24v144c0 13.25 10.74 24 24 24h102.06l88.97 88.95c15.15 15.15 40.97 4.48 40.97-16.96V88.02c0-21.46-25.82-32.12-40.97-16.97zM480 256c0-63.53-32.06-121.94-85.77-156.24-11.19-7.14-26.03-3.82-33.12 7.37s-3.78 26.02 7.41 33.12C407.2 165.46 432 208.58 432 256s-24.8 90.54-63.47 115.75c-11.19 7.14-14.5 22.02-7.41 33.12 7.1 11.19 21.93 14.55 33.12 7.37C447.94 377.94 480 319.53 480 256z" />)}</svg>);

// ============================================================
// SHARED COMPONENTS
// ============================================================
const AlertItem = ({ alert, onClick, darkMode }) => {
  const getStyle = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("stealing") || t.includes("crime"))
      return darkMode ? "bg-red-950/20 border-red-500 text-red-400 font-bold" : "bg-red-50 border-red-500 text-red-700 font-bold";
    if (t.includes("loitering"))
      return darkMode ? "bg-blue-950/20 border-blue-500 text-blue-400" : "bg-blue-50 border-blue-500 text-blue-700";
    if (t.includes("pacing"))
      return darkMode ? "bg-orange-950/20 border-orange-500 text-orange-400" : "bg-orange-50 border-orange-500 text-orange-700";
    if (t.includes("scanning"))
      return darkMode ? "bg-pink-950/20 border-pink-500 text-pink-400" : "bg-pink-50 border-pink-500 text-pink-700";
    return darkMode ? "bg-gray-800 border-gray-500 text-gray-300" : "bg-gray-50 border-gray-500 text-gray-700";
  };
  return (
    <li onClick={onClick} className={`p-3 border-l-4 rounded-r-md shadow-sm cursor-pointer hover:scale-[1.01] transition-transform ${getStyle(alert.type)}`}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="font-bold text-sm uppercase">{alert.type}</span>
          <span className="text-[10px] font-mono font-bold mt-0.5 opacity-80">
            Confidence: {alert.accuracy ? (alert.accuracy * 100).toFixed(0) + "%" : (alert.confidence || "N/A")}
          </span>
        </div>
        <span className="text-[10px] opacity-70 font-mono">{alert.timestamp || "Live"}</span>
      </div>
      <div className={`flex justify-between items-center mt-2 border-t pt-1 ${darkMode ? "border-white/10" : "border-black/5"}`}>
        <p className="text-[10px] opacity-80 truncate">Cam: {alert.camera_name || "N/A"}</p>
        {!alert.video_url && !alert.video && (
          <span className="text-[9px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full font-black animate-pulse">
            PROCESSING CLIP...
          </span>
        )}
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${darkMode ? "bg-white/10" : "bg-white/50"}`}>👤 {alert.suspects || 1}</span>
      </div>
    </li>
  );
};

// 1. PURE LIVE CAMERA FEED
const CameraFeed = ({ cameraNames, serverUrl, darkMode }) => {
  return (
    <div className={`lg:col-span-2 border rounded-2xl shadow-lg overflow-hidden transition-colors ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between transition-colors ${darkMode ? "bg-gray-800/50 border-gray-800" : "bg-gray-50 border-gray-100"}`}>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            LIVE FEED
          </span>
        </div>
        {cameraNames.length > 0 && (
          <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-bold">
            {cameraNames.length} cam{cameraNames.length > 1 ? "s" : ""} active
          </span>
        )}
      </div>

      <div className="w-full bg-black p-1">
        {cameraNames.length > 0 ? (
          <div className={`grid gap-1 ${cameraNames.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {cameraNames.map(cam => (
              <div key={cam} className="relative">
                <span className="absolute top-2 left-2 z-10 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full font-mono uppercase">{cam}</span>
                <img src={`${serverUrl}/video/${cam}?t=${Date.now()}`} alt={cam} className="w-full aspect-video rounded"
                  style={{ objectFit: "fill" }}
                  onError={(e) => { e.target.src = "https://via.placeholder.com/640x360?text=Stream+Loading..."; }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full aspect-video flex justify-center items-center">
            <p className="text-white italic text-sm animate-pulse">Waiting for camera streams...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. COMPONENT PARA SA SAVED RECORDINGS
const RecordingsArchive = ({ serverUrl, orgId, darkMode }) => {
  const [replayDate, setReplayDate] = useState(new Date().toISOString().split("T")[0]);
  const [replayCamera, setReplayCamera] = useState("");
  const [recordings, setRecordings] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingReplay, setLoadingReplay] = useState(false);
  const [recordedCameras, setRecordedCameras] = useState([]);

  // 🚨 BAGONG STATE PARA SA DELETE MODAL
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    const fetchRecordedCameras = async () => {
      try {
        const res = await fetch(`${serverUrl}/get_recorded_cameras?org_id=${orgId}`, {
          headers: { "ngrok-skip-browser-warning": "69420" }
        });
        if (res.ok) {
          const data = await res.json();
          setRecordedCameras(data.cameras || []);
          if (data.cameras && data.cameras.length > 0 && !replayCamera) {
            setReplayCamera(data.cameras[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching recorded cameras:", error);
      }
    };
    fetchRecordedCameras();
  }, [orgId, serverUrl, replayCamera]);

  const fetchRecordings = async () => {
    if (!replayCamera || !replayDate || !orgId) return;
    setLoadingReplay(true);
    setSelectedVideo(null);
    try {
      const res = await fetch(`${serverUrl}/get_recordings?camera=${replayCamera}&date=${replayDate}&org_id=${orgId}`, {
        headers: { "ngrok-skip-browser-warning": "69420" }
      });
      if (res.ok) {
        const data = await res.json();
        setRecordings(data.files || []);
      } else {
        setRecordings([]);
      }
    } catch (error) {
      console.error("Error fetching recordings:", error);
      setRecordings([]);
    } finally {
      setLoadingReplay(false);
    }
  };

  // 🚨 BUBUNKSAN ANG MODAL KAPAG PININDOT ANG TRASH
  const confirmDelete = (e, fileName) => {
    e.stopPropagation();
    setVideoToDelete(fileName);
    setIsDeleteModalOpen(true);
  };

  // 🚨 ITO ANG TATAWAGIN KAPAG PININDOT YUNG "YES" SA MODAL
  const executeDeleteRecord = async () => {
    if (!videoToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`${serverUrl}/delete_raw_record`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420"
        },
        body: JSON.stringify({
          camera: replayCamera,
          date: replayDate,
          file: videoToDelete,
          org_id: orgId
        })
      });

      if (res.ok) {
        toast.success("Moved to Recycle Bin in Settings");
        setRecordings(prev => prev.filter(f => f !== videoToDelete));
        if (selectedVideo === videoToDelete) setSelectedVideo(null);
      } else {
        toast.error("Failed to move video");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Server error");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setVideoToDelete(null);
    }
  };

  return (
    <div className={`mt-8 border rounded-2xl shadow-lg overflow-hidden transition-colors ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
      {/* Header & Controls */}
      <div className={`px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${darkMode ? "bg-gray-800/50 border-gray-800" : "bg-gray-50 border-gray-100"}`}>
        <div className="flex flex-col">
          <h2 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
            Saved Recordings 
          </h2>
          {/* 🚨 DAGDAG INFO TEXT DITO */}
          <p className={`text-xs flex items-center gap-1 mt-1 font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            <Info size={14} className="text-violet-500" /> This video recording will be moved to the trash bin after 14 days.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={replayCamera} onChange={(e) => setReplayCamera(e.target.value)}
            className={`text-sm p-2 rounded-lg outline-none border ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-700"}`}>
            <option value="" disabled>Select Camera</option>
            {recordedCameras.map(cam => <option key={cam} value={cam}>{cam}</option>)}
          </select>
          <input type="date" value={replayDate} onChange={(e) => setReplayDate(e.target.value)}
            className={`text-sm p-2 rounded-lg outline-none border ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-700"}`} />
          <button onClick={fetchRecordings}
            className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-sm">
            Load Files
          </button>
        </div>
      </div>

      {/* Content Area: Grid with Video Player & Row List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        
        {/* Left Side: Video Player */}
        <div className={`lg:col-span-2 bg-black rounded-xl flex flex-col items-center justify-center border overflow-hidden relative min-h-[350px] ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
          {selectedVideo ? (
            <video src={`${serverUrl}/play_record?camera=${replayCamera}&date=${replayDate}&file=${selectedVideo}&org_id=${orgId}`}
              controls autoPlay className="w-full h-full object-contain" />
          ) : (
            <div className="text-center p-6">
              <span className="text-5xl opacity-50">🎬</span>
              <p className="text-white font-bold text-lg mt-3">No Video Selected</p>
              <p className="text-gray-400 text-sm mt-1">Select a file from the list to play.</p>
            </div>
          )}
        </div>

        {/* Right Side: Rows of Recordings */}
        <div className="flex flex-col h-[350px]">
          <h3 className={`text-sm font-bold uppercase mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Results ({recordings.length})
          </h3>
          <div className={`flex-1 overflow-y-auto pr-2 rounded-lg border ${darkMode ? "border-gray-800 bg-gray-950/30" : "border-gray-200 bg-gray-50"} p-2`}>
            {loadingReplay ? (
              <p className="text-sm text-gray-500 p-4 text-center">Searching Storage...</p>
            ) : recordings.length === 0 ? (
              <p className="text-sm text-gray-500 p-4 text-center italic">No recordings found.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recordings.map((file, idx) => (
                  <div key={idx} className={`flex items-center justify-between w-full p-2 rounded-lg border transition-all ${
                    selectedVideo === file 
                      ? "bg-violet-600 border-violet-600 text-white shadow-md" 
                      : darkMode 
                        ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" 
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}>
                    {/* Video Selection Button */}
                    <button onClick={() => setSelectedVideo(file)} className="flex items-center flex-1 text-left overflow-hidden outline-none">
                      <span className="text-sm mr-3">{selectedVideo === file ? "▶" : "🎞️"}</span>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-bold truncate">{file}</span>
                      </div>
                    </button>
                    
                    {/* Trash Bin Button - Triggers Modal */}
                    <button 
                      onClick={(e) => confirmDelete(e, file)} 
                      className={`p-2 rounded-md transition-colors ${selectedVideo === file ? "text-violet-200 hover:text-white hover:bg-violet-700" : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"}`}
                      title="Move to Recycle Bin"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🚨 CONFIRMATION MODAL PARA SA SAVED RECORDINGS */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDeleteRecord}
        title="Move to Recycle Bin?"
        message="This recording will be hidden and moved to the Recycle Bin in Settings. You can still restore it later."
        loading={isDeleting}
        confirmText="Move to Bin"
        type="danger"
      />
    </div>
  );
};


// ============================================================
// MAIN USER DASHBOARD
// ============================================================
export default function Dashboard() {
  const theme = useSelector(selectTheme);
  const darkMode = theme === 'dark';
  const { user: currentUser, organization: actualOrgId } = useAuth();
  const navigate = useNavigate();
  const [time, setTime]               = useState(new Date());
  const [isMuted, setIsMuted]         = useState(true);
  const [alerts, setAlerts]           = useState([]);
  const [cameraNames, setCameraNames] = useState([]);
  const [orgSoundUrl, setOrgSoundUrl] = useState("/alert.mp3");
  const isMutedRef                    = useRef(true);

  const playAlertSoundRef = useRef(null);

  // 1. Fetch Organization Sound Configuration
  useEffect(() => {
    if (!actualOrgId) return;
    const fetchOrgSettings = async () => {
      try {
        const orgDocRef = doc(db, "organizations", actualOrgId);
        const orgDocSnap = await getDoc(orgDocRef);
        if (orgDocSnap.exists()) {
          const data = orgDocSnap.data();
          if (data.alarm_sound) {
            setOrgSoundUrl(data.alarm_sound);
          }
        }
      } catch (error) {
        console.error("[DASHBOARD] Error fetching org settings:", error);
      }
    };
    fetchOrgSettings();
  }, [actualOrgId]);

  const { playAlertSound } = useRealTimeDashboard({
    soundUrl: orgSoundUrl,
    onNewAlert: (eventPayload) => {
      if (!isMutedRef.current) {
        playAlertSoundRef.current?.();
      }
    },
    onNewDetection: (detectionData) => {
      const placeholder = {
        id: `temp-${Date.now()}`,
        camera_name: detectionData.camera_name,
        type: detectionData.detection_type,
        confidence: `${detectionData.confidence}%`,
        timestamp: "Just Now",
        video_url: null,
        is_placeholder: true
      };

      setAlerts(prev => {
        const exists = prev.some(a =>
          a.camera_name === placeholder.camera_name &&
          a.type === placeholder.type &&
          (a.is_placeholder || a.timestamp === "Just Now")
        );
        if (exists) return prev;
        return [placeholder, ...prev].slice(0, 20);
      });

      if (!isMutedRef.current) {
        playAlertSoundRef.current?.();
      }
    }
  });

  useEffect(() => {
    playAlertSoundRef.current = playAlertSound;
  }, [playAlertSound]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 2. Fetch Active Cameras
  useEffect(() => {
    if (!actualOrgId) return;
    const fetch_ = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/cameras?org_id=${actualOrgId}`, {
          headers: { "ngrok-skip-browser-warning": "69420" }
        });
        const data = await res.json();
        if (data.cameras?.length > 0)
          setCameraNames(data.cameras.map(c => typeof c === "object" ? c.name : c));
        else setCameraNames([]);
      } catch {}
    };
    fetch_();
    const t = setInterval(fetch_, 5000);
    return () => clearInterval(t);
  }, [actualOrgId]);

  // 3. Listen to Firestore alerts
  useEffect(() => {
    if (!actualOrgId) return;

    const q = query(
      collection(db, "detections"),
      where("org_id", "==", actualOrgId),
      orderBy("created_at", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setAlerts([]);
        return;
      }
      const logs = snapshot.docs.map((docSnap) => {
        const docData = docSnap.data();
        let timeLabel = "Live";
        if (docData.created_at && typeof docData.created_at.toDate === 'function') {
          timeLabel = docData.created_at.toDate().toLocaleTimeString();
        } else if (docData.timestamp) {
          timeLabel = docData.timestamp;
        }
        return {
          id: docSnap.id,
          ...docData,
          timestamp: timeLabel,
          type: docData.type || docData.action || "Detection",
          video_url: docData.video_url || docData.clipUrl || null
        };
      });
      setAlerts(logs);
    });

    return () => unsubscribe();
  }, [actualOrgId]);

  const handleToggleMute = () => {
    const m = !isMuted;
    setIsMuted(m);
    isMutedRef.current = m;

    if (!m) {
      playAlertSound();
    }
  };

  const formattedTime = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formattedDate = time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className={`p-6 min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-950" : "bg-gray-50"}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-4xl font-bold flex items-center gap-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
          <IconVideo className="text-violet-500" /> Dashboard
        </h1>
        <button onClick={handleToggleMute}
          className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border transition-all w-auto justify-center ${
            isMuted
              ? (darkMode ? "bg-gray-800 text-gray-400 border-gray-700" : "bg-gray-200 text-gray-500 border-gray-300")
              : "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800 shadow-sm ring-2 ring-violet-500/20"}`}>
          <IconVolume isMuted={isMuted} className="w-5 h-5" />
          <span className="font-bold text-[10px] sm:text-sm uppercase sm:normal-case tracking-tight sm:tracking-normal leading-tight text-center">
            {isMuted ? "Muted" : "Alert On"}
          </span>
        </button>

      </div>

      {/* TOP SECTION: LIVE CAMERA & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CameraFeed cameraNames={cameraNames} serverUrl={SERVER_URL} darkMode={darkMode} />

        <div className="flex flex-col gap-6">
          <div className={`border rounded-2xl shadow-lg p-6 flex flex-col items-center transition-colors ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
            <h2 className={`text-lg font-semibold mb-3 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>Date & Time</h2>
            <div className="text-4xl font-bold text-violet-600 mb-4 tabular-nums tracking-tight">{formattedTime}</div>
            <div className={`border rounded-xl p-4 text-center w-full transition-colors ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
              <p className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{formattedDate}</p>
            </div>
          </div>

          <div className={`border rounded-2xl shadow-lg p-4 flex flex-col h-[380px] transition-colors ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
            <h2 className={`text-lg font-semibold mb-3 flex items-center justify-between ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
              <div className="flex items-center gap-2">
                <IconExclamation className="text-orange-500" /> Recent Alerts
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? "bg-gray-800 text-gray-500" : "bg-gray-100 text-gray-500"}`}>{alerts.length} Total</span>
            </h2>
            <div className="flex-1 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <p className="text-gray-400 text-center py-10 italic text-sm font-medium">No anomalies detected yet.</p>
              ) : (
                <ul className="space-y-3">
                  {alerts.map((alert, i) => (
                    <AlertItem key={i} alert={alert} darkMode={darkMode}
                      onClick={() => navigate("/alert", { state: { alertIdToFocus: alert.file } })} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: SAVED RECORDINGS ARCHIVE */}
      <RecordingsArchive serverUrl={SERVER_URL} orgId={actualOrgId} darkMode={darkMode} />

    </div>
  );
}