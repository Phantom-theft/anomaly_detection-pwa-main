/* eslint-disable */
import React, { useEffect, useState, useRef } from "react";
import { Bell, AlertTriangle, Loader2, Trash2, Clock, Video, CloudOff, RefreshCw, ShieldAlert } from "lucide-react";
import { collection, query, onSnapshot, doc, updateDoc, limit, orderBy, where } from "firebase/firestore";
import { toast } from "react-toastify";
import { db } from "../firebase/config";
import useAuth from "../hooks/useAuth";
import ConfirmModal from "../components/ConfirmModal";
import { useSelector } from "react-redux";
import { selectTheme } from "../store/slices/uiSlice";

const rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
let cleanUrl = rawApiUrl.replace(/\/+$/, "");
if (cleanUrl.includes("ngrok-free.dev")) cleanUrl = cleanUrl.replace(":5000", "");
if (window.location.protocol === "https:" && cleanUrl.includes("ngrok-free.dev")) cleanUrl = cleanUrl.replace("http://", "https://");

const SERVER_URL = cleanUrl;

const getConfidenceColor = (confidence) => {
  if (!confidence) return "#6b7280";
  const c = confidence.toUpperCase();
  if (c.includes("HIGH"))     return "#7c3aed";
  if (c.includes("MODERATE")) return "#d97706";
  return "#ef4444";
};

const AlertLogsPage = () => {
  const theme = useSelector(selectTheme);
  const darkMode = theme === 'dark';
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, organization: orgId } = useAuth();
  const [error, setError] = useState(null);

  // New state for multi-selection
  const [selectedAlertIds, setSelectedAlertIds] = useState([]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const alertRefs = useRef({});

  useEffect(() => {
    if (!user || !orgId) {
        if (!user && !loading) { setError("Session not found. Please log in."); setLoading(false); }
        return;
    }

    setLoading(true);
    setError(null);

    const targetOrgId = orgId || "default";

    // Standard Query: Fetching real org_id to avoid Permission Errors
    let q = query(
      collection(db, "detections"),
      where("org_id", "==", targetOrgId),
      orderBy("created_at", "desc"),
      limit(50)
    );

    const processSnapshot = (snapshot) => {
      if (snapshot.empty) {
        setAlerts([]); setLoading(false); return;
      }

      const data = snapshot.docs.map((docSnap) => {
        const docData = docSnap.data();
        let timeLabel = "Processing...";
        if (docData.timestamp) {
          if (typeof docData.timestamp.toDate === 'function') {
            timeLabel = docData.timestamp.toDate().toLocaleString('en-PH');
          } else { timeLabel = String(docData.timestamp); }
        }
        return {
          id: docSnap.id,
          ...docData,
          formattedTime: timeLabel,
          action: docData.type || docData.action || "Detection",
          video: docData.video_url || docData.clipUrl || null
        };
      })
      // CLIENT-SIDE FILTER: Hide alerts that are marked as deleted
      .filter(alert => !alert.is_deleted);

      setAlerts(data);
      setLoading(false);
      setError(null);
    };

    let unsubscribe = onSnapshot(q, processSnapshot, (err) => {
      console.error("Firestore Error:", err);
      if (err.code === 'failed-precondition' || err.code === 'permission-denied') {
        const fallbackQ = query(collection(db, "detections"), where("org_id", "==", targetOrgId), limit(50));
        unsubscribe = onSnapshot(fallbackQ, processSnapshot, () => setLoading(false));
      } else { setError("Database connection error."); setLoading(false); }
    });

    return () => unsubscribe && unsubscribe();
  }, [user, orgId, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.info("Syncing with database...");
  };

  const confirmDelete = (alert) => {
    setAlertToDelete(alert);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!user) return;
    
    // Determine what to delete: single item or bulk selection
    const idsToDelete = alertToDelete ? [alertToDelete.id] : selectedAlertIds;
    if (idsToDelete.length === 0) return;

    setIsDeleting(true);

    try {
      // SOFT DELETE LOGIC - Process all IDs in parallel
      const batch = idsToDelete.map(id => 
        updateDoc(doc(db, "detections", id), { is_deleted: true })
      );
      
      await Promise.all(batch);
      
      toast.success(idsToDelete.length > 1 
        ? `${idsToDelete.length} alerts moved to Recycle Bin` 
        : "Alert moved to Settings > Recycle Bin"
      );
      
      setSelectedAlertIds([]); // Clear selection after successful bulk delete
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete alert(s).");
    } finally {
      setIsDeleting(false); 
      setIsDeleteModalOpen(false); 
      setAlertToDelete(null);
    }
  };

  const getStyle = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("fighting") || t.includes("pose")) return { icon: <AlertTriangle className="text-red-500" />, bg: darkMode ? "bg-red-900/20" : "bg-red-50", border: "border-red-500" };
    if (t.includes("stealing")) return { icon: <Bell className="text-purple-500" />, bg: darkMode ? "bg-purple-900/20" : "bg-purple-50", border: "border-purple-500" };
    if (t.includes("scanning")) return { icon: <Clock className="text-pink-500" />, bg: darkMode ? "bg-pink-900/20" : "bg-pink-50", border: "border-pink-500" };
    return { icon: <Clock className="text-blue-500" />, bg: darkMode ? "bg-blue-900/20" : "bg-blue-50", border: "border-blue-500" };
  };

  return (
    <div className={`p-6 min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-950" : "bg-gray-50"}`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-violet-600 rounded-3xl text-white shadow-lg"><Bell size={28} /></div>
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? "text-white" : "text-gray-800"}`}>Active Alerts</h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest opacity-70">Filtered by Organization</p>
            </div>
          </div>

          <button 
            onClick={handleRefresh}
            className={`group p-4 rounded-3xl transition-all duration-500 shadow-lg hover:shadow-violet-500/20 active:scale-95 ${
              darkMode 
                ? "bg-gray-900 border border-gray-800 text-violet-400 hover:bg-gray-800" 
                : "bg-white border border-gray-100 text-violet-600 hover:bg-gray-50"
            }`}
            title="Refresh Alerts"
          >
            <RefreshCw 
              size={24} 
              className={`transition-transform duration-500 ${loading ? "animate-spin" : "group-hover:rotate-180"}`} 
            />
          </button>
        </div>

        {error && (
          <div className={`mb-6 p-5 border-l-8 border-red-500 rounded-3xl shadow-xl flex items-start gap-4 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
            <div className="p-2 bg-red-100 rounded-xl text-red-600"><ShieldAlert size={28} /></div>
            <div>
              <p className="font-bold uppercase tracking-tight text-xs text-red-600 mb-1">Database Error</p>
              <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{error}</p>
            </div>
          </div>
        )}

        <div className={`rounded-[2.5rem] shadow-sm border overflow-hidden min-h-[60vh] ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
          {/* Multi-Select Header */}
          {alerts.length > 0 && (
            <div className={`px-8 py-4 border-b flex items-center justify-between ${darkMode ? "bg-gray-800/30 border-gray-800" : "bg-gray-50 border-gray-100"}`}>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={alerts.length > 0 && selectedAlertIds.length === alerts.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedAlertIds(alerts.map(a => a.id));
                    else setSelectedAlertIds([]);
                  }}
                  className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <span className={`text-sm font-bold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Select All</span>
              </div>
              
              {selectedAlertIds.length > 0 && (
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95"
                >
                  <Trash2 size={14} />
                  Delete Selected ({selectedAlertIds.length})
                </button>
              )}
            </div>
          )}

          <div className="h-[75vh] overflow-y-auto p-4 custom-scrollbar">
            {loading && !error ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Loader2 className="animate-spin mb-3 text-violet-500" size={40} />
                <p className="text-xs font-bold uppercase tracking-tighter">Connecting...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <CloudOff size={48} className="mb-4 opacity-20" />
                <p className="text-center font-bold uppercase text-sm tracking-tight text-gray-300">No Active Alerts</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => {
                  const { icon, bg, border } = getStyle(alert.action);
                  const accuracyPct = alert.accuracy ? Math.round(alert.accuracy * 100) : null;

                  return (
                    <div key={alert.id} className={`flex flex-col md:flex-row items-center gap-6 p-8 border ${border} rounded-[2rem] transition-all hover:shadow-md ${darkMode ? "bg-gray-800/50" : "bg-white"}`}>
                      {/* Selection Checkbox */}
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={selectedAlertIds.includes(alert.id)}
                          onChange={(e) => {
                            setSelectedAlertIds(prev => 
                              prev.includes(alert.id) ? prev.filter(id => id !== alert.id) : [...prev, alert.id]
                            );
                          }}
                          className="w-6 h-6 rounded-lg border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer transition-all"
                        />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${bg}`}>{icon}</div>
                          <span className={`font-extrabold text-xl tracking-tight capitalize ${darkMode ? "text-white" : "text-gray-800"}`}>{alert.action}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono font-bold">
                          <Clock size={12} /> {alert.formattedTime}
                        </div>
                        <p className={`text-sm leading-relaxed font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Device: <span className={`font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{alert.camera_name}</span>
                        </p>

                        {/* ── Incident Details Card (IBINALIK) ── */}
                        <div className={`mt-2 p-3 rounded-2xl border text-xs space-y-1.5 font-mono ${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-bold uppercase tracking-wider">Track ID</span>
                            <span className={`font-bold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{alert.track_id ?? "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-bold uppercase tracking-wider">Accuracy</span>
                            <span className="font-bold text-violet-600">{accuracyPct ? `${accuracyPct}%` : "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-bold uppercase tracking-wider">Confidence</span>
                            <span className="font-bold" style={{ color: getConfidenceColor(alert.confidence) }}>{alert.confidence || "—"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-96">
                        {alert.video ? (
                          <div className={`relative group overflow-hidden rounded-[1.5rem] shadow-xl border-4 ${darkMode ? "border-gray-700" : "border-white"}`}>
                            <video src={alert.video} controls className="w-full aspect-video object-cover bg-black">
                                <track kind="captions" />
                            </video>
                          </div>
                        ) : (
                          <div className={`aspect-video rounded-[1.5rem] flex flex-col items-center justify-center border-2 border-dashed ${darkMode ? "bg-gray-900 border-gray-700 text-gray-600" : "bg-gray-100 border-gray-200 text-gray-300"}`}>
                            <Video size={32} className="mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Processing...</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={() => confirmDelete(alert)} 
                          className={`p-4 transition-all duration-300 rounded-2xl group hover:-translate-y-1.5 active:translate-y-0 ${
                            darkMode 
                              ? "text-gray-100 hover:text-red-600 hover:bg-red-300 hover:shadow-[0_8px_25px_-5px_rgba(248,113,113,0.4)]" 
                              : "text-gray-300 hover:text-red-500 hover:bg-red-50 hover:shadow-[0_8px_25px_-5px_rgba(239,68,68,0.2)]"
                          }`}
                        >
                          <Trash2 size={24} className="transition-colors duration-300" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete}
        title="Move to Recycle Bin?" message="This alert will be hidden and moved to the Recycle Bin in Settings."
        loading={isDeleting} confirmText="Move to Bin" type="danger"
      />
    </div>
  );
};

export default AlertLogsPage;