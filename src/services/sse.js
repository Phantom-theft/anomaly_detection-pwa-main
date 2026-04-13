/**
 * SSE (Server-Sent Events) Service Client
 *
 * FIXES APPLIED:
 * 1. Tinanggal ang eventSource.connect() — walang ganyang method ang EventSource
 * 2. Proper reconnect: ginagawa ang BAGONG EventSource object sa bawat reconnect
 * 3. Ang onerror ay hindi na nag-fi-fire ng paulit-ulit — may isOnce guard
 * 4. Ang closed flag ay nagpoprotekta laban sa reconnect pagkatapos ng manual close()
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const SSE_EVENTS = {
  ALERT: 'alert',
  CAMERA_STATUS: 'camera_status',
  DETECTION: 'detection',
  HEALTH: 'health',
  CONNECTED: 'connected',
  HEARTBEAT: 'heartbeat'
};

const DEFAULT_EVENTS = [SSE_EVENTS.ALERT, SSE_EVENTS.CAMERA_STATUS, SSE_EVENTS.DETECTION];

export const createSSEConnection = (events = DEFAULT_EVENTS, onMessage, onError, clientId = null, orgId = null) => {
  const finalClientId = clientId || `sse-client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;


  const eventsParam = events.join(',');

  const cleanBaseUrl = BASE_URL.replace(/\/+$/, "");
  let url = `${cleanBaseUrl}/stream?events=${encodeURIComponent(eventsParam)}&client_id=${encodeURIComponent(finalClientId)}`;
  
  if (orgId) {
    url += `&org_id=${encodeURIComponent(orgId)}`;
  }

  let eventSource = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 50;
  const RECONNECT_DELAY = 3000;

  // FIX: Flag para malaman kung sinadyang isara ang connection (via close())
  // Kapag true, hindi na mag-re-reconnect kahit mag-error
  let manuallyClosed = false;

  // FIX: Ginawa itong function para magamit ulit sa reconnect
  // Dati: isang beses lang ginagawa ang EventSource, kaya walang tunay na reconnect
  const createEventSource = () => {
    // Huwag gumawa ng bago kung sinara na nang sinasadya
    if (manuallyClosed) return;

    // Isara muna ang dati (kung mayroon)
    if (eventSource) {
      eventSource.close();
    }

    try {
      eventSource = new EventSource(url);
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      if (onError) onError(error);
      return;
    }

    // I-attach ang event listeners sa bagong EventSource
    events.forEach(eventType => {
      eventSource.addEventListener(eventType, (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) {
            onMessage({ type: eventType, data, timestamp: Date.now() });
          }
        } catch (error) {
          console.error(`[SSE] Failed to parse ${eventType} event:`, error);
        }
      });
    });

    eventSource.onopen = () => {
      console.log('[SSE] Connection established');
      reconnectAttempts = 0; // I-reset ang counter pagkatapos makonekta
    };

    // FIX: Ang onerror ay gumagawa ng BAGONG EventSource sa reconnect
    // Hindi na ginagamit ang eventSource.connect() na hindi naman exists
    eventSource.onerror = (error) => {
      // FIX: Huwag mag-reconnect kung sinara na nang sinasadya
      if (manuallyClosed) return;

      console.error('[SSE] Connection error:', error);
      if (onError) onError(error);

      // FIX: Isara ang broken EventSource bago gumawa ng bago
      eventSource.close();

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`[SSE] Reconnecting... Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);

        // FIX: Gumawa ng BAGONG EventSource pagkatapos ng delay
        // Dati: eventSource.connect() — hindi valid, kaya hindi nag-reconnect
        reconnectTimer = setTimeout(() => {
          if (!manuallyClosed) {
            createEventSource();
          }
        }, RECONNECT_DELAY);
      } else {
        console.error('[SSE] Max reconnection attempts reached');
      }
    };
  };

  // Simulan ang unang connection
  createEventSource();

  return {
    close: () => {
      // FIX: I-set muna ang flag BAGO isara para hindi mag-trigger ng reconnect
      manuallyClosed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
        console.log('[SSE] Connection closed');
      }
    },
    readyState: () => eventSource?.readyState,
    clientId: finalClientId
  };
};

export const connectToSSE = (options = {}) => {
  const {
    events = DEFAULT_EVENTS,
    onAlert = null,
    onCameraStatus = null,
    onDetection = null,
    onHealth = null,
    onConnected = null,
    onHeartbeat = null,
    onError = null,
    clientId = null,
    orgId = null
  } = options;

  const handleMessage = (message) => {
    const { type, data, timestamp } = message;
    switch (type) {
      case SSE_EVENTS.ALERT:
        onAlert && onAlert(data, timestamp);
        break;
      case SSE_EVENTS.CAMERA_STATUS:
        onCameraStatus && onCameraStatus(data, timestamp);
        break;
      case SSE_EVENTS.DETECTION:
        onDetection && onDetection(data, timestamp);
        break;
      case SSE_EVENTS.HEALTH:
        onHealth && onHealth(data, timestamp);
        break;
      case SSE_EVENTS.CONNECTED:
        onConnected && onConnected(data, timestamp);
        break;
      case SSE_EVENTS.HEARTBEAT:
        onHeartbeat && onHeartbeat(data, timestamp);
        break;
      default:
        console.log('[SSE] Unknown event type:', type);
    }
  };

  return createSSEConnection(events, handleMessage, onError, clientId, orgId);
};

export const subscribeToEvents = (eventTypes, callback) => {
  const connection = createSSEConnection(
    eventTypes,
    callback,
    (error) => console.error('[SSE] Subscription error:', error)
  );
  return () => connection && connection.close();
};

export const isSSESupported = () => typeof EventSource !== 'undefined';

export default {
  createSSEConnection,
  connectToSSE,
  subscribeToEvents,
  isSSESupported,
  SSE_EVENTS
};