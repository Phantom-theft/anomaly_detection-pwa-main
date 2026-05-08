import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import store from './store';
import App from "./App";
import './index.css';

// ── SUPPRESS RESIZEOBSERVER WARNINGS ──
// This prevents the "ResizeObserver loop completed with undelivered notifications" 
// error from showing an overlay during development.
const isResizeObserverError = (msg) => {
  return msg && (
    msg.includes('ResizeObserver loop completed with undelivered notifications.') ||
    msg.includes('ResizeObserver loop limit exceeded')
  );
};

window.addEventListener('error', (e) => {
  if (isResizeObserverError(e.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const originalOnerror = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  if (typeof message === 'string' && isResizeObserverError(message)) {
    return true; // Prevents the fire of the default error handler
  }
  if (originalOnerror) {
    return originalOnerror(message, source, lineno, colno, error);
  }
};

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <ToastContainer 
                    theme="colored" 
                    position="top-center" 
                    autoClose={3000} 
                    hideProgressBar={true}
                />
                <App />
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/serviceworker.js')
            .then((reg) => console.log('[PWA] Service Worker registered:', reg.scope))
            .catch((err) => console.error('[PWA] Service Worker registration failed:', err));
    });
}


