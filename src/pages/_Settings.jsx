/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme, selectTheme } from "../store/slices/uiSlice";
import {
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  orderBy,
  limit
} from "firebase/firestore";
import {
  Moon, Sun, Shield, User, Lock, Trash2, LogOut,
  ChevronRight, X, BookOpen, Bell, AlertTriangle, Undo, Video, CloudOff, FolderArchive,
  Eye, EyeOff
} from "lucide-react";
import { app } from "../firebase/config";
import useAuth from "../hooks/useAuth";
import useRealTimeAlerts from "../hooks/useRealTimeAlerts";
import ConfirmModal from "../components/ConfirmModal"; // 🚨 DAGDAG: ConfirmModal Import

const auth = getAuth(app);
const db   = getFirestore(app);
const rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
let cleanUrl = rawApiUrl.replace(/\/+$/, "");
if (cleanUrl.includes("ngrok-free.dev")) cleanUrl = cleanUrl.replace(":5000", "");
if (window.location.protocol === "https:" && cleanUrl.includes("ngrok-free.dev")) cleanUrl = cleanUrl.replace("http://", "https://");

const SERVER_URL = cleanUrl;

// ============================================================
// CHANGE PASSWORD MODAL
// ============================================================
const ChangePasswordModal = ({ isOpen, onClose, darkMode }) => {
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [loading, setLoading]       = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) return toast.error("New passwords do not match!");
    if (newPw.length < 6)    return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const user       = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);
      toast.success("Password updated successfully!");
      onClose();
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (error) {
      toast.error(error.code === "auth/wrong-password" ? "Incorrect current password." : "Failed to update password.");
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${darkMode ? "bg-gray-900 border border-gray-800" : "bg-white"} rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transition-colors`}>
        <div className={`p-6 border-b flex justify-between items-center ${darkMode ? "bg-gray-800/50 border-gray-800" : "bg-gray-50 border-gray-100"}`}>
          <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Change Password</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {[
            { label: "Current Password",     val: currentPw, set: setCurrentPw, show: showCurrent, setShow: setShowCurrent },
            { label: "New Password",          val: newPw,     set: setNewPw,     show: showNew,     setShow: setShowNew },
            { label: "Confirm New Password",  val: confirmPw, set: setConfirmPw, show: showConfirm, setShow: setShowConfirm },
          ].map(({ label, val, set, show, setShow }) => (
            <div key={label}>
              <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{label}</label>
              <div className="relative">
                <input 
                  type={show ? "text" : "password"} 
                  value={val} 
                  onChange={(e) => set(e.target.value)} 
                  required
                  className={`w-full p-3 pr-10 border-2 rounded-xl focus:border-violet-500 outline-none transition-all ${
                      darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-800"
                  }`} 
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-violet-500 transition-colors"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition mt-2 active:scale-95 shadow-lg shadow-violet-500/20">
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// DELETE ACCOUNT MODAL
// ============================================================
const DeleteAccountModal = ({ isOpen, onClose, darkMode }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();

  const handleDelete = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user       = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      toast.success("Account permanently deleted.");
      navigate("/login");
    } catch (error) {
      if (error.code === "auth/wrong-password") toast.error("Incorrect password.");
      else toast.error("Failed to delete account.");
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className={`${darkMode ? "bg-gray-900 border border-red-900/20" : "bg-white"} rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transition-colors`}>
        <div className={`p-6 border-b flex justify-between items-center ${darkMode ? "bg-red-950/20 border-red-900/30 text-red-400" : "bg-red-50 border-red-100 text-red-700"}`}>
          <h3 className="text-xl font-bold">Delete Account</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleDelete} className="p-8 space-y-4">
          <div className={`flex items-center gap-3 p-4 rounded-2xl ${darkMode ? "bg-red-900/10 border border-red-900/20" : "bg-red-50 border border-red-100"}`}>
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
            <p className={`${darkMode ? "text-red-400" : "text-red-700"} text-sm font-medium`}>This action is permanent and cannot be undone.</p>
          </div>
          <label className={`block text-xs font-bold uppercase ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Enter Password to Confirm</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className={`w-full p-3 border-2 rounded-xl focus:border-red-500 outline-none transition-all ${
                darkMode ? "bg-gray-800 border-red-900/30 text-white" : "bg-white border-red-100 text-gray-800"
            }`} />
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition active:scale-95 shadow-lg shadow-red-500/20">
            {loading ? "Deleting..." : "Permanently Delete Account"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// TOGGLE COMPONENT
// ============================================================
const Toggle = ({ enabled, onChange }) => (
  <button onClick={onChange}
    className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${enabled ? "bg-violet-600" : "bg-gray-200"}`}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? "translate-x-6" : "translate-x-0"}`} />
  </button>
);

// ============================================================
// SECTION CARD
// ============================================================
const SectionCard = ({ title, icon, children, darkMode }) => (
  <div className={`${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"} rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300`}>
    <div className={`px-6 py-4 border-b flex items-center gap-2 ${darkMode ? "bg-gray-800/50 border-gray-800" : "bg-gray-50 border-gray-50"}`}>
      <span className="text-violet-500">{icon}</span>
      <h3 className={`font-bold text-sm uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-700"}`}>{title}</h3>
    </div>
    <div className={`divide-y ${darkMode ? "divide-gray-800" : "divide-gray-50"}`}>{children}</div>
  </div>
);

const SettingRow = ({ icon, title, desc, action, danger = false, darkMode }) => (
  <div className={`flex items-center justify-between px-6 py-4 transition-colors duration-200 ${
    danger 
        ? (darkMode ? "hover:bg-red-950/10" : "hover:bg-red-50") 
        : (darkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50")
  }`}>
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-xl ${
        danger 
            ? (darkMode ? "bg-red-950/20 text-red-500" : "bg-red-50 text-red-500") 
            : (darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-50 text-gray-500")
      }`}>{icon}</div>
      <div>
        <p className={`font-semibold text-sm ${
            danger 
                ? "text-red-600" 
                : (darkMode ? "text-white" : "text-gray-800")
        }`}>{title}</p>
        {desc && <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{desc}</p>}
      </div>
    </div>
    <div>{action}</div>
  </div>
);

// ============================================================
// MAIN SETTINGS PAGE
// ============================================================
export default function Settings() {
  const dispatch            = useDispatch();
  const theme               = useSelector(selectTheme);
  const darkMode            = theme === 'dark';
  
  const { user: currentUserData, role, organization: orgId } = useAuth();
  const { requestNotificationPermission, triggerAlert } = useRealTimeAlerts({ autoConnect: false });
  const navigate            = useNavigate();

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notifications_enabled');
    if (saved !== null) return saved === 'true';
    return "Notification" in window && Notification.permission === "granted";
  });

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      localStorage.setItem('notifications_enabled', 'false');
      toast.info("Notifications disabled in app.");
      return;
    }
    
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationsEnabled(true);
      localStorage.setItem('notifications_enabled', 'true');
      toast.success("Notifications enabled!");
    } else {
      toast.error("Notification permission denied or not supported.");
    }
  };

  const [prefs, setPrefs]               = useState({
    loitering_still: true,
    loitering_area:  true,
    pacing:          true,
    scanning:        true,
    stealing:        true,
  });
  
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [isPasswordOpen, setPasswordOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen]     = useState(false);
  const [activeTab, setActiveTab]         = useState("appearance");

  // Recycle Bin State
  const [binTab, setBinTab]             = useState("alerts"); 
  
  // Alert Logs Bin State
  const [binAlerts, setBinAlerts]       = useState([]);
  const [loadingBin, setLoadingBin]     = useState(false);

  // Raw Recordings Bin State
  const [binReplayDate, setBinReplayDate] = useState(new Date().toISOString().split("T")[0]);
  const [binReplayCamera, setBinReplayCamera] = useState("");
  const [binRecordings, setBinRecordings] = useState([]);
  const [binSelectedVideo, setBinSelectedVideo] = useState(null);
  const [loadingBinRecordings, setLoadingBinRecordings] = useState(false);
  const [binRecordedCameras, setBinRecordedCameras] = useState([]);

  // Selection states for multi-select in Recycle Bin
  const [selectedAlertIds, setSelectedAlertIds] = useState([]);
  const [selectedRecordingFiles, setSelectedRecordingFiles] = useState([]);

  const currentUser = auth.currentUser;

  // 🚨 UNIFIED CONFIRM MODAL STATE
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    type: "", // "restore_alert", "delete_alert", "restore_raw", "delete_raw"
    item: null // alert ID or raw filename
  });
  const [isConfirming, setIsConfirming] = useState(false);

  // 1. Load preferences
  useEffect(() => {
    if (!currentUser) return;
    const fetch_ = async () => {
      try {
        const snap = await getDoc(doc(db, "user_preferences", currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.detection_prefs) setPrefs(data.detection_prefs);
        }
      } catch (e) { console.error(e); }
      finally { setLoadingPrefs(false); }
    };
    fetch_();
  }, [currentUser]);

  // 2. Load Firestore Deleted Alert Logs
  useEffect(() => {
    // 🚨 Safety Check: Ensure orgId exists before querying
    if (activeTab !== "bin" || binTab !== "alerts" || !orgId || orgId === "default") {
      setLoadingBin(false);
      return;
    }

    setLoadingBin(true);

    const q = query(
        collection(db, "detections"),
        where("org_id", "==", orgId),
        orderBy("created_at", "desc"),
        limit(100) 
      );

    const processSnapshot = (snapshot) => {
      const data = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        formattedTime: docSnap.data().timestamp && typeof docSnap.data().timestamp.toDate === 'function' 
          ? docSnap.data().timestamp.toDate().toLocaleString('en-PH')
          : String(docSnap.data().timestamp || "Processing...")
      }))
      .filter(alert => alert.is_deleted === true);

      setBinAlerts(data);
      setLoadingBin(false);
    };

    let unsubscribe = onSnapshot(q, processSnapshot, (err) => {
      console.error("Firestore Error (Bin):", err);
      // Fallback kung wala pang composite index
      if (err.code === 'failed-precondition' || err.code === 'permission-denied') {
        const fallbackQ = query(collection(db, "detections"), where("org_id", "==", orgId), limit(100));
        unsubscribe = onSnapshot(fallbackQ, processSnapshot, () => setLoadingBin(false));
      } else {
        setLoadingBin(false);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [activeTab, binTab, orgId]);

  // 3. Load Raw Recordings Bin Cameras
  useEffect(() => {
    if (activeTab !== "bin" || binTab !== "raw" || !orgId) return;
    
    const fetchBinCameras = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/get_recorded_cameras?org_id=${orgId}&is_bin=true`);
        if (res.ok) {
          const data = await res.json();
          setBinRecordedCameras(data.cameras || []);
          if (data.cameras && data.cameras.length > 0 && !binReplayCamera) {
            setBinReplayCamera(data.cameras[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching bin cameras:", error);
      }
    };
    fetchBinCameras();
  }, [activeTab, binTab, orgId, binReplayCamera]);

  // 4. Fetch Raw Recordings for Bin
  const fetchBinRecordings = async () => {
    if (!binReplayCamera || !binReplayDate || !orgId) return;
    setLoadingBinRecordings(true);
    setBinSelectedVideo(null);
    try {
      const res = await fetch(`${SERVER_URL}/get_recordings?camera=${binReplayCamera}&date=${binReplayDate}&org_id=${orgId}&is_bin=true`);
      if (res.ok) {
        const data = await res.json();
        setBinRecordings(data.files || []);
      } else {
        setBinRecordings([]);
      }
    } catch (error) {
      console.error("Error fetching bin recordings:", error);
      setBinRecordings([]);
    } finally {
      setLoadingBinRecordings(false);
    }
  };

  // 5. Apply dark mode to ROOT
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#030712"; 
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "";
    }
  }, [darkMode]);

  const savePrefs = async (newPrefs) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "user_preferences", currentUser.uid), {
        detection_prefs: newPrefs,
      }, { merge: true });
      toast.success("Preferences saved!");
    } catch { toast.error("Failed to save preferences."); }
  };

  const handleTogglePref = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    savePrefs(updated);
  };

  const handleToggleDark = async () => {
    dispatch(toggleTheme());
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "user_preferences", currentUser.uid), { dark_mode: !darkMode }, { merge: true });
    } catch {}
  };

  const handleLogout = async () => {
    await auth.signOut();
    toast.success("Logged out successfully.");
    navigate("/login");
  };

  // ============================================
  // UNIFIED MODAL HANDLERS
  // ============================================
  const openConfirmModal = (e, type, item) => {
    e.stopPropagation();
    setConfirmModalState({ isOpen: true, type, item });
  };

  const handleConfirmAction = async () => {
    const { type, item } = confirmModalState;
    if (!item) return;
    setIsConfirming(true);

    try {
      // ── AI ALERT BULK ACTIONS ──
      if (type === "restore_alert_bulk") {
        const batch = item.map(id => updateDoc(doc(db, "detections", id), { is_deleted: false }));
        await Promise.all(batch);
        toast.success(`${item.length} alerts restored!`);
        setSelectedAlertIds([]);
      }
      else if (type === "delete_alert_bulk") {
        const batch = item.map(id => deleteDoc(doc(db, "detections", id)));
        await Promise.all(batch);
        toast.success(`${item.length} alerts permanently deleted.`);
        setSelectedAlertIds([]);
      }

      // ── RAW RECORDING BULK ACTIONS ──
      else if (type === "restore_raw_bulk" || type === "delete_raw_bulk") {
        const isRestore = type === "restore_raw_bulk";
        const endpoint = isRestore ? "/restore_raw_record" : "/permanent_delete_raw_record";
        
        // Loop through all selected files
        let successCount = 0;
        for (const file of item) {
          try {
            const res = await fetch(`${SERVER_URL}${endpoint}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
              body: JSON.stringify({
                camera: binReplayCamera,
                date: binReplayDate,
                file: file,
                org_id: orgId
              })
            });
            if (res.ok) successCount++;
          } catch (e) { console.error(`Failed ${file}:`, e); }
        }

        toast.success(`${successCount} recordings ${isRestore ? "restored" : "permanently deleted"}.`);
        setBinRecordings(prev => prev.filter(f => !item.includes(f)));
        setSelectedRecordingFiles([]);
      }

      // ── SINGLE ACTIONS (EXISTING) ──
      else if (type === "restore_alert") {
        await updateDoc(doc(db, "detections", item), { is_deleted: false });
        toast.success("Alert restored successfully!");
      } 
      else if (type === "delete_alert") {
        await deleteDoc(doc(db, "detections", item));
        toast.success("Alert permanently deleted.");
      } 
      else if (type === "restore_raw" || type === "delete_raw") {
        // Release Windows File Lock by clearing the video player first!
        if (binSelectedVideo === item) {
          setBinSelectedVideo(null);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const endpoint = type === "restore_raw" ? "/restore_raw_record" : "/permanent_delete_raw_record";
        const res = await fetch(`${SERVER_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" },
          body: JSON.stringify({
            camera: binReplayCamera,
            date: binReplayDate,
            file: item,
            org_id: orgId
          })
        });

        if (res.ok) {
          toast.success(type === "restore_raw" ? "Recording restored to Dashboard" : "Recording permanently deleted");
          setBinRecordings(prev => prev.filter(f => f !== item));
          // Clean up selection if needed
          setSelectedRecordingFiles(prev => prev.filter(f => f !== item));
        } else {
          const errData = await res.json();
          toast.error(errData.error || "Action failed");
        }
      }
    } catch (err) {
      console.error("Action error:", err);
      toast.error("An error occurred.");
    } finally {
      setIsConfirming(false);
      setConfirmModalState({ isOpen: false, type: "", item: null });
    }
  };

  // 🚨 Dynamic UI Content for the Modal
  let modalTitle = "";
  let modalMessage = "";
  let confirmText = "";
  let isDanger = true;

  switch (confirmModalState.type) {
    case "restore_alert":
    case "restore_alert_bulk":
      modalTitle = "Restore Alert Log?";
      modalMessage = confirmModalState.type.includes("bulk") 
        ? `Are you sure you want to restore ${confirmModalState.item?.length} selected alerts?`
        : "This alert will be returned to your active Dashboard and Alert Logs.";
      confirmText = "Restore Alert";
      isDanger = false;
      break;
    case "delete_alert":
    case "delete_alert_bulk":
      modalTitle = "Permanently Delete Alert?";
      modalMessage = confirmModalState.type.includes("bulk")
        ? `Are you sure you want to permanently delete ${confirmModalState.item?.length} selected alerts? This cannot be undone.`
        : "This will permanently remove the alert from the cloud. This action cannot be undone.";
      confirmText = "Delete Permanently";
      isDanger = true;
      break;
    case "restore_raw":
    case "restore_raw_bulk":
      modalTitle = "Restore Raw Recording?";
      modalMessage = confirmModalState.type.includes("bulk")
        ? `Restore ${confirmModalState.item?.length} selected videos back to the Dashboard?`
        : "This video will be moved back to the main storage and will be visible on the Dashboard again.";
      confirmText = "Restore Video";
      isDanger = false;
      break;
    case "delete_raw":
    case "delete_raw_bulk":
      modalTitle = "Permanently Delete Recording?";
      modalMessage = confirmModalState.type.includes("bulk")
        ? `Permanently delete ${confirmModalState.item?.length} selected videos from the hard drive? This cannot be undone.`
        : "This video will be permanently deleted from the hard drive. This action cannot be undone.";
      confirmText = "Delete Permanently";
      isDanger = true;
      break;
    default:
      break;
  }

  const tabs = [
    { key: "appearance",  label: "Appearance",  icon: <Sun size={16} /> },
    { key: "detection",   label: "Detection",   icon: <Shield size={16} /> },
    { key: "account",     label: "Account",     icon: <User size={16} /> },
    { key: "bin",         label: "Recycle Bin", icon: <Trash2 size={16} /> },
    { key: "help",        label: "Help",        icon: <BookOpen size={16} /> },
  ].filter(tab => !(tab.key === 'bin' && role === 'admin'));

  const detectionItems = [
    { key: "loitering_still", label: "Loitering (Still)",   desc: "Alert when a person stands still for too long." },
    { key: "pacing",          label: "Pacing",              desc: "Detect repetitive back-and-forth movement." },
    { key: "stealing",        label: "Stealing",            desc: "Monitor for suspicious item handling." },
  ];

  return (
    <div className={`p-6 min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-950" : "bg-gray-50"}`}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-violet-600 rounded-2xl text-white shadow-xl shadow-violet-500/20">
            <Shield size={24} />
          </div>
          <div>
            <h1 className={`text-3xl font-extrabold tracking-tight ${darkMode ? "text-white" : "text-gray-800"}`}>Settings</h1>
            <p className={`text-sm font-medium ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Manage your preferences and account</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex flex-wrap p-1.5 rounded-2xl shadow-sm border mb-8 transition-colors ${
            darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
        }`}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${
                activeTab === tab.key 
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20 scale-[1.02]" 
                    : `${darkMode ? "text-gray-500 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-50"}`
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* APPEARANCE TAB */}
        {activeTab === "appearance" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <SectionCard title="Display & Alerts" icon={<Sun size={16} />} darkMode={darkMode}>
              <SettingRow
                darkMode={darkMode}
                icon={darkMode ? <Moon size={18} className="text-violet-400" /> : <Sun size={18} />}
                title="Dark Mode"
                desc="Switch between light and dark theme"
                action={<Toggle enabled={darkMode} onChange={handleToggleDark} />}
              />
              {role !== 'admin' && (
                <SettingRow
                  darkMode={darkMode}
                  icon={<Bell size={18} className="text-violet-500" />}
                  title="System Notifications"
                  desc="Receive alerts even when the app is in the background"
                  action={<Toggle enabled={notificationsEnabled} onChange={handleToggleNotifications} />}
                />
              )}
            </SectionCard>
          </div>
        )}

        {/* DETECTION TAB */}
        {activeTab === "detection" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <SectionCard title="Behavior Alerts" icon={<Bell size={16} />} darkMode={darkMode}>
              {detectionItems.map(item => (
                <SettingRow
                  key={item.key}
                  darkMode={darkMode}
                  icon={<Shield size={18} className="text-violet-500" />}
                  title={item.label}
                  desc={item.desc}
                  action={<div className={`w-2 h-2 rounded-full ${darkMode ? "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" : "bg-violet-600"}`}></div>}
                />
              ))}
            </SectionCard>
            <p className={`text-xs text-center px-4 font-medium ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
              These behaviors are actively monitored by the AI core engine.
            </p>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === "account" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <SectionCard title="Profile Information" icon={<User size={16} />} darkMode={darkMode}>
              <SettingRow
                darkMode={darkMode}
                icon={<User size={18} />}
                title="Username"
                desc={currentUser?.displayName || "—"}
                action={null}
              />
              <SettingRow
                darkMode={darkMode}
                icon={<Lock size={18} />}
                title="Email Address"
                desc={currentUser?.email || "—"}
                action={null}
              />
              <SettingRow
                darkMode={darkMode}
                icon={<Shield size={18} />}
                title="Access Level"
                desc={role?.toUpperCase() || "—"}
                action={null}
              />
            </SectionCard>

            <SectionCard title="Security" icon={<Lock size={16} />} darkMode={darkMode}>
              <button onClick={() => setPasswordOpen(true)}
                className={`w-full flex items-center justify-between px-6 py-5 transition-colors ${
                    darkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-50 text-gray-500"}`}><Lock size={18} /></div>
                  <div>
                    <p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>Change Password</p>
                    <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Update your account security</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            </SectionCard>

            <SectionCard title="Danger Zone" icon={<AlertTriangle size={16} />} darkMode={darkMode}>
              <button onClick={handleLogout}
                className={`w-full flex items-center justify-between px-6 py-5 transition-colors ${
                    darkMode ? "hover:bg-red-950/10" : "hover:bg-red-50"
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${darkMode ? "bg-red-950/20 text-red-500" : "bg-red-50 text-red-500"}`}><LogOut size={18} /></div>
                  <p className="font-bold text-sm text-red-600">Sign Out</p>
                </div>
                <ChevronRight size={16} className="text-red-300/50" />
              </button>
              <button onClick={() => setDeleteOpen(true)}
                className={`w-full flex items-center justify-between px-6 py-5 transition-colors ${
                    darkMode ? "hover:bg-red-950/10" : "hover:bg-red-50"
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${darkMode ? "bg-red-950/20 text-red-500" : "bg-red-50 text-red-500"}`}><Trash2 size={18} /></div>
                  <p className="font-bold text-sm text-red-600">Delete Account</p>
                </div>
                <ChevronRight size={16} className="text-red-300/50" />
              </button>
            </SectionCard>
          </div>
        )}

        {/* RECYCLE BIN TAB */}
        {activeTab === "bin" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* Sub-Tabs for Bin */}
            <div className={`flex bg-gray-200 p-1 rounded-xl w-max mb-4 ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}>
              <button onClick={() => setBinTab("alerts")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${binTab === 'alerts' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                AI Alert Logs
              </button>
              <button onClick={() => setBinTab("raw")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${binTab === 'raw' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                24/7 Raw Recordings
              </button>
            </div>

            {/* ALERT LOGS BIN CONTENT */}
            {binTab === "alerts" && (
              <SectionCard title="Deleted Alert Logs" icon={<Trash2 size={16} />} darkMode={darkMode}>
                <div className="p-4">
                  {/* Select All & Delete All Header */}
                  {binAlerts.length > 0 && (
                    <div className={`flex items-center justify-between mb-4 pb-2 border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={binAlerts.length > 0 && selectedAlertIds.length === binAlerts.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedAlertIds(binAlerts.map(a => a.id));
                            else setSelectedAlertIds([]);
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                        />
                        <span className={`text-xs font-bold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Select All</span>
                      </div>
                      
                      {selectedAlertIds.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => openConfirmModal(e, "restore_alert_bulk", selectedAlertIds)}
                            className="text-xs font-bold text-green-600 hover:underline px-2 py-1"
                          >
                            Restore ({selectedAlertIds.length})
                          </button>
                          <button 
                            onClick={(e) => openConfirmModal(e, "delete_alert_bulk", selectedAlertIds)}
                            className="text-xs font-bold text-red-500 hover:underline px-2 py-1"
                          >
                            Delete Selected
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {loadingBin ? (
                    <p className="text-center text-sm py-8 text-gray-500">Loading deleted logs...</p>
                  ) : binAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                      <CloudOff size={40} className="mb-3 opacity-30" />
                      <p className="text-xs font-bold uppercase tracking-widest text-center">Alert Bin is Empty</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {binAlerts.map(alert => (
                        <div key={alert.id} className={`flex items-center justify-between p-4 rounded-2xl border ${darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50/50'}`}>
                          <div className="flex items-center gap-4">
                            <input 
                              type="checkbox" 
                              checked={selectedAlertIds.includes(alert.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedAlertIds(prev => 
                                  prev.includes(alert.id) ? prev.filter(id => id !== alert.id) : [...prev, alert.id]
                                );
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                            />
                            <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white border text-gray-500'}`}>
                              <Video size={18} />
                            </div>
                            <div>
                              <p className={`text-sm font-bold capitalize ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                {alert.type || alert.action || "Detection"}
                              </p>
                              <div className={`text-xs mt-0.5 flex items-center gap-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                <span className="font-mono">{alert.formattedTime}</span>
                                <span>•</span>
                                <span>{alert.camera_name || "Unknown Camera"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* 🚨 MODAL TRIGGERS PARA SA AI ALERTS */}
                            <button onClick={(e) => openConfirmModal(e, "restore_alert", alert.id)}
                              className={`p-2 rounded-lg transition-colors text-green-600 ${darkMode ? 'hover:bg-green-950/30' : 'hover:bg-green-50'}`}
                              title="Restore Alert">
                              <Undo size={18} />
                            </button>
                            <button onClick={(e) => openConfirmModal(e, "delete_alert", alert.id)}
                              className={`p-2 rounded-lg transition-colors text-red-500 ${darkMode ? 'hover:bg-red-950/30' : 'hover:bg-red-50'}`}
                              title="Permanently Delete">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* RAW RECORDINGS BIN CONTENT */}
            {binTab === "raw" && (
              <SectionCard title="Archived Raw Recordings" icon={<FolderArchive size={16} />} darkMode={darkMode}>
                <div className="p-4">
                  {/* Controls */}
                  <div className={`flex flex-wrap items-center gap-3 mb-6 pb-4 border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                    <select value={binReplayCamera} onChange={(e) => setBinReplayCamera(e.target.value)}
                      className={`text-sm p-2 rounded-lg outline-none border ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-700"}`}>
                      <option value="" disabled>Select Camera</option>
                      {binRecordedCameras.map(cam => <option key={cam} value={cam}>{cam}</option>)}
                    </select>
                    <input type="date" value={binReplayDate} onChange={(e) => setBinReplayDate(e.target.value)}
                      className={`text-sm p-2 rounded-lg outline-none border ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-700"}`} />
                    <button onClick={fetchBinRecordings}
                      className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
                      Load Archived Files
                    </button>
                  </div>

                  {/* Video Player + List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Player */}
                    <div className={`bg-black rounded-xl flex flex-col items-center justify-center border overflow-hidden relative min-h-[250px] ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
                      {binSelectedVideo ? (
                        <video src={`${SERVER_URL}/play_record?camera=${binReplayCamera}&date=${binReplayDate}&file=${binSelectedVideo}&org_id=${orgId}&is_bin=true`}
                          controls autoPlay className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center p-4">
                          <span className="text-4xl opacity-50">📂</span>
                          <p className="text-white font-bold text-sm mt-2">No Video Selected</p>
                        </div>
                      )}
                    </div>

                    {/* List */}
                    <div className={`h-[250px] overflow-y-auto pr-2 rounded-lg border ${darkMode ? "border-gray-800 bg-gray-950/30" : "border-gray-200 bg-gray-50"} p-2`}>
                      {/* Select All & Bulk Actions for Raw */}
                      {binRecordings.length > 0 && (
                        <div className={`flex items-center justify-between mb-2 pb-1 border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={binRecordings.length > 0 && selectedRecordingFiles.length === binRecordings.length}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedRecordingFiles([...binRecordings]);
                                else setSelectedRecordingFiles([]);
                              }}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                            />
                            <span className={`text-[10px] font-bold ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Select All</span>
                          </div>
                          
                          {selectedRecordingFiles.length > 0 && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={(e) => openConfirmModal(e, "restore_raw_bulk", selectedRecordingFiles)}
                                className="text-[10px] font-black text-green-600 hover:underline"
                              >
                                Restore
                              </button>
                              <button 
                                onClick={(e) => openConfirmModal(e, "delete_raw_bulk", selectedRecordingFiles)}
                                className="text-[10px] font-black text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {loadingBinRecordings ? (
                        <p className="text-sm text-gray-500 p-4 text-center">Searching Archived Storage...</p>
                      ) : binRecordings.length === 0 ? (
                        <p className="text-sm text-gray-500 p-4 text-center italic">No archived recordings found.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {binRecordings.map((file, idx) => (
                            <div key={idx} className={`flex items-center justify-between w-full p-2 rounded-lg border transition-all ${
                              binSelectedVideo === file 
                                ? "bg-violet-600 border-violet-600 text-white shadow-md" 
                                : darkMode 
                                  ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" 
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                            }`}>
                              
                              <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                <input 
                                  type="checkbox" 
                                  checked={selectedRecordingFiles.includes(file)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setSelectedRecordingFiles(prev => 
                                      prev.includes(file) ? prev.filter(f => f !== file) : [...prev, file]
                                    );
                                  }}
                                  className="w-3.5 h-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer flex-shrink-0"
                                />
                                {/* Selection Button */}
                                <button onClick={() => setBinSelectedVideo(file)} className="flex items-center flex-1 text-left overflow-hidden outline-none">
                                  <span className="text-sm mr-2">{binSelectedVideo === file ? "▶" : "🎞️"}</span>
                                  <span className="text-xs font-bold truncate">{file}</span>
                                </button>
                              </div>

                              {/* 🚨 MODAL TRIGGERS PARA SA RAW RECORDINGS */}
                              <div className="flex items-center gap-1 mr-1">
                                <button onClick={(e) => openConfirmModal(e, "restore_raw", file)}
                                  className={`p-1.5 rounded transition-colors ${binSelectedVideo === file ? "text-green-300 hover:text-white" : "text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"}`}
                                  title="Restore to Dashboard">
                                  <Undo size={16} />
                                </button>
                                <button onClick={(e) => openConfirmModal(e, "delete_raw", file)}
                                  className={`p-1.5 rounded transition-colors ${binSelectedVideo === file ? "text-red-300 hover:text-white" : "text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"}`}
                                  title="Permanently Delete">
                                  <Trash2 size={16} />
                                </button>
                              </div>

                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}

            <p className={`text-xs text-center px-4 font-medium ${darkMode ? "text-gray-600" : "text-gray-400"}`}>
              {binTab === "alerts" ? "Restoring an alert returns it to your Dashboard and Alert Logs." : "These are 24/7 recordings. Restoring returns them to the Dashboard."}
            </p>
          </div>
        )}

        {/* HELP TAB */}
        {activeTab === "help" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <SectionCard title="User Manual" icon={<BookOpen size={16} />} darkMode={darkMode}>
              <div className={`p-6 space-y-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>

                <div className={`${darkMode ? "bg-gray-800/40" : "bg-violet-50"} rounded-2xl p-5 border ${darkMode ? "border-violet-900/20" : "border-violet-100"}`}>
                  <h4 className={`font-bold text-sm mb-2 ${darkMode ? "text-violet-400" : "text-violet-700"}`}>📷 Adding a Camera</h4>
                  <p className="text-xs leading-relaxed opacity-80">Navigate to <strong>Camera Directory</strong>. Cameras added by your Administrator will automatically appear here once synchronized with the AI backend.</p>
                </div>

                <div className={`${darkMode ? "bg-gray-800/40" : "bg-blue-50"} rounded-2xl p-5 border ${darkMode ? "border-blue-900/20" : "border-blue-100"}`}>
                  <h4 className={`font-bold text-sm mb-2 ${darkMode ? "text-blue-400" : "text-blue-700"}`}>🚨 Understanding Alerts</h4>
                  <ul className="text-xs space-y-2 opacity-80">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> <strong>Loitering</strong> — Person standing still or pacing too long.</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span> <strong>Pacing</strong> — Detect repetitive back-and-forth movement in a specific area.</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> <strong>Stealing</strong> — AI detected suspicious item handling.</li>
                  </ul>
                </div>

                <div className={`${darkMode ? "bg-gray-800/40" : "bg-green-50"} rounded-2xl p-5 border ${darkMode ? "border-green-900/20" : "border-green-100"}`}>
                  <h4 className={`font-bold text-sm mb-2 ${darkMode ? "text-green-400" : "text-green-700"}`}>👥 Household Management</h4>
                  <p className="text-xs leading-relaxed opacity-80">Standard users can view feeds and alerts. Only Household Admins can add new members or configure camera hardware.</p>
                </div>

              </div>
            </SectionCard>
          </div>
        )}

      </div>

      <ChangePasswordModal isOpen={isPasswordOpen} onClose={() => setPasswordOpen(false)} darkMode={darkMode} />
      <DeleteAccountModal  isOpen={isDeleteOpen}   onClose={() => setDeleteOpen(false)}   darkMode={darkMode} />
      
      {/* 🚨 UNIFIED CONFIRMATION MODAL PARA SA RECYCLE BIN ACTIONS */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState({ isOpen: false, type: "", item: null })}
        onConfirm={handleConfirmAction}
        title={modalTitle}
        message={modalMessage}
        loading={isConfirming}
        confirmText={confirmText}
        type={isDanger ? "danger" : "primary"}
      />
    </div>
  );
}