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

