// API Endpoint constants
// All endpoints are relative to the base API URL

const API_VERSION = '/api/v1';

export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_VERSION}/auth/login`,
    LOGOUT: `${API_VERSION}/auth/logout`,
    REFRESH_TOKEN: `${API_VERSION}/auth/refresh`,
    VERIFY_TOKEN: `${API_VERSION}/auth/verify`
  },

  // Users
  USERS: {
    BASE: `${API_VERSION}/users`,
    PROFILE: `${API_VERSION}/users/profile`,
    BY_ID: (id) => `${API_VERSION}/users/${id}`,
    UPDATE_ROLE: (id) => `${API_VERSION}/users/${id}/role`,
    DELETE: (id) => `${API_VERSION}/users/${id}`,
    LIST: (orgId) => orgId ? `${API_VERSION}/users?org_id=${orgId}` : `${API_VERSION}/users`
  },

  // Organizations
  ORGANIZATIONS: {
    BASE: `${API_VERSION}/organizations`,
    BY_ID: (id) => `${API_VERSION}/organizations/${id}`,
    USERS: (id) => `${API_VERSION}/organizations/${id}/users`,
    CAMERAS: (id) => `${API_VERSION}/organizations/${cameras}/${id}`,
    SETTINGS: (id) => `${API_VERSION}/organizations/${id}/settings`,
    DELETE: (id) => `${API_VERSION}/organizations/${id}`
  },

  // Cameras
  CAMERAS: {
    BASE: `${API_VERSION}/cameras`,
    BY_ID: (id) => `${API_VERSION}/cameras/${id}`,
    STATUS: (id) => `${API_VERSION}/cameras/${id}/status`,
    STREAM: (id) => `${API_VERSION}/cameras/${id}/stream`,
    SNAPSHOT: (id) => `${API_VERSION}/cameras/${id}/snapshot`,
    DELETE: (id) => `${API_VERSION}/cameras/${id}`,
    LIST_BY_ORG: (orgId) => `${API_VERSION}/cameras?org_id=${orgId}`,
    REGISTER: `${API_VERSION}/cameras/register`,
    UPDATE: (id) => `${API_VERSION}/cameras/${id}`
  },

  // Alerts
  ALERTS: {
    BASE: `${API_VERSION}/alerts`,
    BY_ID: (id) => `${API_VERSION}/alerts/${id}`,
    LIST: (orgId) => orgId ? `${API_VERSION}/alerts?org_id=${orgId}` : `${API_VERSION}/alerts`,
    UNREAD: (orgId) => `${API_VERSION}/alerts/unread?org_id=${orgId}`,
    MARK_READ: (id) => `${API_VERSION}/alerts/${id}/read`,
    MARK_ALL_READ: `${API_VERSION}/alerts/read-all`,
    DELETE: (id) => `${API_VERSION}/alerts/${id}`,
    STATS: (orgId) => `${API_VERSION}/alerts/stats?org_id=${orgId}`
  },

  // Detection
  DETECTION: {
    BASE: `${API_VERSION}/detection`,
    START: `${API_VERSION}/detection/start`,
    STOP: `${API_VERSION}/detection/stop`,
    STATUS: `${API_VERSION}/detection/status`,
    CONFIGURE: `${API_VERSION}/detection/configure`,
    CONFIGS: `${API_VERSION}/detection/configs`,
    CONFIG_BY_ID: (id) => `${API_VERSION}/detection/configs/${id}`
  },

  // Settings
  SETTINGS: {
    BASE: `${API_VERSION}/settings`,
    SYSTEM: `${API_VERSION}/settings/system`,
    NOTIFICATIONS: `${API_VERSION}/settings/notifications`,
    EMAIL: `${API_VERSION}/settings/email`,
    UPDATE: (key) => `${API_VERSION}/settings/${key}`
  },

  // Analytics
  ANALYTICS: {
    BASE: `${API_VERSION}/analytics`,
    DASHBOARD: `${API_VERSION}/analytics/dashboard`,
    CAMERA_STATS: (cameraId) => `${API_VERSION}/analytics/camera/${cameraId}`,
    ALERT_STATS: (orgId) => `${API_VERSION}/analytics/alerts?org_id=${orgId}`,
    TIME_SERIES: `${API_VERSION}/analytics/time-series`
  },

  // Health check
  HEALTH: `/health`,
  
  // Video streaming
  VIDEO: {
    HLS: (cameraId) => `${API_VERSION}/video/${cameraId}/hls`,
    MJPEG: (cameraId) => `${API_VERSION}/video/${cameraId}/mjpeg`
  }
};

export default ENDPOINTS;
