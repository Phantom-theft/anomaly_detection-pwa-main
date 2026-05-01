/**
 * Custom hook for real-time alert updates using SSE
 *
 * FIXES APPLIED:
 * 1. Audio object is created ONCE and never replaced — preserves browser unlock
 * 2. playAlertSound has NO dependencies — prevents SSE reconnect loop
 * 3. connect() no longer depends on playAlertSound — stops infinite re-connections
 * 4. onAlert in connect() calls playAlertSoundRef.current — always gets latest function
 * 5. Added Web Notification API integration
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
  useEffect(() => {
    if (!alertSoundRef.current) {
      console.log('[useRealTimeAlerts] Setting sound URL to:', soundUrl);
      alertSoundRef.current = new Audio(soundUrl);
      alertSoundRef.current.preload = 'auto';
    } else {
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
  }, []);

  // FIX #3: I-sync ang ref sa pinakabagong version ng playAlertSound
  useEffect(() => {
    playAlertSoundRef.current = playAlertSound;
  }, [playAlertSound]);

  // Notification logic
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }
    
    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    
    return false;
  }, []);

  const showNotification = useCallback((data) => {
    console.log('[useRealTimeAlerts] showNotification called with permission:', Notification.permission);
    if (Notification.permission !== "granted") {
      console.warn('[useRealTimeAlerts] Notification permission not granted. Current state:', Notification.permission);
      return;
    }

    const title = `Alert: ${data.camera_name || 'System'}`;
    const options = {
      body: data.message || `New ${data.type || 'anomaly'} detected!`,
      icon: '/icons/192x192.png',
      badge: '/icons/96x96.png',
      vibrate: [200, 100, 200],
      tag: 'anomaly-alert',
      renotify: true,
      data: {
        url: '/alert'
      }
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      console.log('[useRealTimeAlerts] Using Service Worker to show notification');
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options)
          .then(() => console.log('[useRealTimeAlerts] registration.showNotification success'))
          .catch(err => console.error('[useRealTimeAlerts] registration.showNotification error:', err));
      });
    } else {
      console.log('[useRealTimeAlerts] Service Worker not ready, using window Notification');
      try {
        new Notification(title, options);
      } catch (e) {
        console.error("[useRealTimeAlerts] Error showing window notification:", e);
      }
    }
  }, []);

  const showNotificationRef = useRef(showNotification);
  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  // FIX #4: connect() ay HINDI na naka-depend sa playAlertSound
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

        if (data?.type !== 'heartbeat') {
          console.log('[useRealTimeAlerts] Calling playAlertSound and showNotification via refs...');
          playAlertSoundRef.current?.();
          showNotificationRef.current?.(data);
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
      camera_name: alertData.camera_name || 'Test Camera',
      message: alertData.message || 'This is a test notification from Anomaly App.',
      timestamp: Date.now(),
      ...alertData
    };
    
    setLastAlert(testAlert);
    if (onNewAlertRef.current) {
      onNewAlertRef.current(testAlert, Date.now());
    }
    
    playAlertSoundRef.current?.();
    showNotificationRef.current?.(testAlert);
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
    playAlertSound,
    requestNotificationPermission
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
