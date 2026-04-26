// src/layouts/AuthLayout.jsx
/* eslint-disable react/prop-types */
import React from "react";
import logo from "../assets/images/logo.jpg";

const AuthLayout = ({ children }) => {
  return (
    <div className="flex w-full h-screen bg-red-50 dark:bg-[#0f0202] transition-colors duration-500 overflow-hidden relative"> 
      
      {/* Background Polish for Form Side */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-30">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-red-400/20 blur-[100px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-rose-400/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Left side: Form (Full width on mobile, 50% on desktop) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 relative z-10">
        <div className="w-full max-w-md animate-fade-in-up">
          {children}
        </div>
      </div>

      {/* Right side: Image (Hidden on mobile, 50% on desktop) */}
      <div className="hidden lg:flex h-full w-1/2 relative items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] hover:scale-105"
          style={{ backgroundImage:`url(${logo})` }}
        ></div>
        
        {/* Responsive Multi-layer Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent dark:from-violet-950/90 dark:via-violet-900/40 dark:to-transparent transition-colors duration-500"></div>
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20 transition-colors duration-500"></div>
      </div> 

    </div>
  );
};

export default AuthLayout;
