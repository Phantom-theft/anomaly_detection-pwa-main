/**
 * Custom hook for real-time alert updates using SSE
 *
 * FIXES APPLIED:
 * 1. Audio object is created ONCE and never replaced — preserves browser unlock
 * 2. playAlertSound has NO dependencies — prevents SSE reconnect loop
 * 3. connect() no longer depends on playAlertSound — stops infinite re-connections
 * 4. onAlert in connect() calls playAlertSoundRef.current — always gets latest function
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { connectToSSE, SSE_EVENTS, isSSESupported } from '../services/sse';
import useAuth from './useAuth';

const useRealTimeAlerts = (options = {}) => {
  const {
    enableAlerts = true,
    enableCameraStatus = false,
    enableDetections = false,
    onNewAlert = null,
    onCameraStatusChange = null,
    onNewDetection = null,
    autoConnect = true,
    soundUrl = '/alert.mp3'
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [lastAlert, setLastAlert] = useState(null);
  const [cameraStatuses, setCameraStatuses] = useState({});
  const [recentDetections, setRecentDetections] = useState([]);

  const { orgId, role } = useAuth();

  const connectionRef = useRef(null);
  const alertSoundRef = useRef(null);       // Audio object — created ONCE, never replaced
  const playAlertSoundRef = useRef(null);   // FIX: Ref to latest playAlertSound function
  const MAX_RECENT_DETECTIONS = 10;

  // FIX #1: Gumawa ng Audio object isang beses lang.
  // Kung palaging ni-replace (tulad ng dati), nawawala ang browser unlock
  // na nakuha sa click event ng user.
  useEffect(() => {
    if (!alertSoundRef.current) {
      // Unang beses — gumawa ng bagong Audio object
      console.log('[useRealTimeAlerts] Setting sound URL to:', soundUrl);
      alertSoundRef.current = new Audio(soundUrl);
      alertSoundRef.current.preload = 'auto';
    } else {
      // Sunod na pagbabago ng soundUrl — i-update lang ang src, HUWAG gumawa ng bago
      // para hindi mawala ang unlock na nakuha ng user
      console.log('[useRealTimeAlerts] Updating sound URL to:', soundUrl);
      alertSoundRef.current.src = soundUrl;
      alertSoundRef.current.load();
    }
  }, [soundUrl]);

  const events = useMemo(() => {
    const evts = [];
    if (enableAlerts) evts.push(SSE_EVENTS.ALERT);
    if (enableCameraStatus) evts.push(SSE_EVENTS.CAMERA_STATUS);
    if (enableDetections) evts.push(SSE_EVENTS.DETECTION);
    return evts;
  }, [enableAlerts, enableCameraStatus, enableDetections]);

  // Refs para hindi mag-reconnect ang SSE tuwing magbago ang callback identity
  const onNewAlertRef = useRef(onNewAlert);
  const onCameraStatusChangeRef = useRef(onCameraStatusChange);
  const onNewDetectionRef = useRef(onNewDetection);

  useEffect(() => { onNewAlertRef.current = onNewAlert; }, [onNewAlert]);
  useEffect(() => { onCameraStatusChangeRef.current = onCameraStatusChange; }, [onCameraStatusChange]);
  useEffect(() => { onNewDetectionRef.current = onNewDetection; }, [onNewDetection]);

  // FIX #2: Walang dependency si playAlertSound.
  // Dati: [soundUrl] — kaya tuwing magbago ang soundUrl, bagong function ang nalilikha,
  // na nag-trigger ng connect() na nag-disconnect at nag-reconnect ng SSE.
  const playAlertSound = useCallback(() => {
    console.log('[useRealTimeAlerts] playAlertSound called');
    try {
      if (!alertSoundRef.current) {
        console.warn('[useRealTimeAlerts] Audio object not ready yet');
        return;
      }
      alertSoundRef.current.currentTime = 0;
      const playPromise = alertSoundRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          if (err.name === 'NotAllowedError') {
            console.warn('[useRealTimeAlerts] Audio blocked — user must click "Alert Sound On" first.');
          } else {
            console.error('[useRealTimeAlerts] Audio playback failed:', err);
          }
        });
      }
    } catch (error) {
      console.error('[useRealTimeAlerts] Error in playAlertSound:', error);
    }
  }, []); // ← WALANG dependency — hindi na mag-re-create, hindi na mag-re-connect ang SSE

  // FIX #3: I-sync ang ref sa pinakabagong version ng playAlertSound
  // para ma-access ito ng connect() nang hindi siya nasa dependency array
  useEffect(() => {
    playAlertSoundRef.current = playAlertSound;
  }, [playAlertSound]);

  // FIX #4: connect() ay HINDI na naka-depend sa playAlertSound
  // Ginagamit nito si playAlertSoundRef.current sa loob ng callbacks
  const connect = useCallback(() => {
    if (!isSSESupported()) {
      console.warn('[useRealTimeAlerts] SSE is not supported in this browser');
      setConnectionError(new Error('SSE is not supported in this browser'));
      return;
    }

    if (connectionRef.current) {
      connectionRef.current.close();
    }

    const finalOrgId = role === 'superadmin' ? null : orgId;

    const connection = connectToSSE({
      events,
      orgId: finalOrgId,
      onAlert: (data, timestamp) => {
        console.log('[useRealTimeAlerts] New alert received:', data);
        setLastAlert({ ...data, receivedAt: timestamp });

        if (onNewAlertRef.current) {
          onNewAlertRef.current(data, timestamp);
        }

        // FIX: Gamitin ang ref — hindi direktang playAlertSound
        // para hindi kailangang kasama sa dependency array ng connect()
        if (data?.type !== 'heartbeat') {
          console.log('[useRealTimeAlerts] Calling playAlertSound via ref...');
          playAlertSoundRef.current?.();
        }
      },
      onCameraStatus: (data, timestamp) => {
        console.log('[useRealTimeAlerts] Camera status update:', data);
        setCameraStatuses(prev => ({
          ...prev,
          [data.camera_name]: { status: data.status, timestamp }
        }));
        if (onCameraStatusChangeRef.current) {
          onCameraStatusChangeRef.current(data, timestamp);
        }
      },
      onDetection: (data, timestamp) => {
        console.log('[useRealTimeAlerts] New detection:', data);
        setRecentDetections(prev =>
          [...prev, { ...data, receivedAt: timestamp }].slice(-MAX_RECENT_DETECTIONS)
        );
        if (onNewDetectionRef.current) {
          onNewDetectionRef.current(data, timestamp);
        }
      },
      onConnected: (data, timestamp) => {
        console.log('[useRealTimeAlerts] Connected to SSE server');
        setIsConnected(true);
        setConnectionError(null);
      },
      onError: (error) => {
        console.error('[useRealTimeAlerts] SSE Error:', error);
        setConnectionError(error);
        setIsConnected(false);
      }
    });

    connectionRef.current = connection;
  // FIX: playAlertSound ay WALA na dito — hindi na mag-re-trigger ng reconnect
  }, [events, role, orgId]);

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const triggerAlert = useCallback((alertData) => {
    const testAlert = {
      type: 'test_alert',
      camera_name: alertData.camera_name || 'test_camera',
      timestamp: Date.now(),
      ...alertData
    };
    setLastAlert(testAlert);
    if (onNewAlertRef.current) {
      onNewAlertRef.current(testAlert, Date.now());
    }
  }, []);

  const clearDetections = useCallback(() => {
    setRecentDetections([]);
  }, []);

  useEffect(() => {
    if (!role || role === 'guest') {
      console.log('[useRealTimeAlerts] Auth not ready, skipping SSE connection');
      return;
    }
    if (role !== 'superadmin' && !orgId) {
      console.log('[useRealTimeAlerts] Missing orgId for non-superadmin, skipping SSE connection');
      return;
    }
    if (autoConnect && events.length > 0) {
      console.log(`[useRealTimeAlerts] Connecting for role: ${role}, orgId: ${orgId}`);
      connect();
    }
    return () => { disconnect(); };
  }, [autoConnect, events.length, connect, disconnect, orgId, role]);

  return {
    isConnected,
    connectionError,
    lastAlert,
    cameraStatuses,
    recentDetections,
    connect,
    disconnect,
    triggerAlert,
    clearDetections,
    playAlertSound
  };
};

export const useRealTimeDashboard = (options = {}) => {
  const {
    onNewAlert = null,
    onCameraStatusChange = null,
    onNewDetection = null,
    soundUrl = '/alert.mp3'
  } = options;

  return useRealTimeAlerts({
    enableAlerts: true,
    enableCameraStatus: true,
    enableDetections: true,
    onNewAlert,
    onCameraStatusChange,
    onNewDetection,
    soundUrl
  });
};

export default useRealTimeAlerts;