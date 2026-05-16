import React, { useState, useEffect, useRef } from "react";
import Header from "../components/_Header";
import Sidebar from "../components/_Sidebar";
import { Outlet } from "react-router-dom"; 
import useAuth from '../hooks/useAuth'; 
import useRealTimeAlerts from "../hooks/useRealTimeAlerts";
import { useSelector } from "react-redux";
import { selectIsMuted } from "../store/slices/uiSlice";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { app } from "../firebase/config";

const db = getFirestore(app);

const MainLayout = () => { 
  const [sidebar, setSidebar] = useState(false);
  const { role, organization: actualOrgId } = useAuth(); 
  const isMuted = useSelector(selectIsMuted);
  const [orgSoundUrl, setOrgSoundUrl] = useState("/alert.mp3");
  
  const isMutedRef = useRef(isMuted);
  const playAlertSoundRef = useRef(null);

  // Sync isMutedRef with isMuted state
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Fetch Organization Sound Configuration
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
        console.error("[MAIN_LAYOUT] Error fetching org settings:", error);
      }
    };
    fetchOrgSettings();
  }, [actualOrgId]);

  const { playAlertSound } = useRealTimeAlerts({
    soundUrl: orgSoundUrl,
    enableAlerts: true,
    enableCameraStatus: false,
    enableDetections: true,
    isMuted: isMuted,
    onNewAlert: (eventPayload) => {
      // Internal hook logic now handles playAlertSound based on isMuted
    },
    onNewDetection: (detectionData) => {
      // Internal hook logic now handles playAlertSound based on isMuted
    }
  });

  useEffect(() => {
    playAlertSoundRef.current = playAlertSound;
  }, [playAlertSound]);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 text-gray-800 dark:text-white transition-colors duration-300">            
      <Sidebar sidebar={sidebar} setSidebar={setSidebar} role={role} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header sidebar={sidebar} setSidebar={setSidebar}/>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-gray-950 transition-colors duration-300">
            <Outlet />
          </div>
        </main>
    </div>
  );
};

export default MainLayout;
