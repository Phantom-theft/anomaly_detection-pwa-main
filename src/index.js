import './suppressErrors'; // MUST BE FIRST IMPORT
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import store from './store';
import App from "./App";
import './index.css';

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

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/serviceworker.js')
            .then((reg) => console.log('[PWA] Service Worker registered:', reg.scope))
            .catch((err) => console.error('[PWA] Service Worker registration failed:', err));
    });
}
