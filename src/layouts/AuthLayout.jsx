// src/layouts/AuthLayout.jsx
import React from "react";
import logo from "../assets/images/logo.jpg";

const AuthLayout = ({ children }) => {
  return (
    <div className="flex w-full h-screen bg-gray-50 dark:bg-[#030712] transition-colors duration-500 overflow-hidden relative"> 
      
      {/* Background Polish for Form Side */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-violet-400/20 blur-[100px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-400/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Left side: Form (Full width on mobile, 50% on desktop) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
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
        
        {/* Modern Multi-layer Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-950/90 via-violet-900/40 to-transparent"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Text Box over Image */}
        <div className="relative z-10 p-16 w-full max-w-2xl">
          <div className="backdrop-blur-xl bg-white/10 p-10 rounded-[2.5rem] border border-white/20 shadow-2xl">
            <h2 className="text-5xl font-black text-white leading-tight mb-6 tracking-tight">
              AI-Powered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-indigo-200">Security</span>
            </h2>
            <p className="text-violet-100/90 text-xl font-medium leading-relaxed">
              Detecting anomalies and securing environments with real-time behavioral analysis.
            </p>
          </div>
        </div>
      </div> 

    </div>
  );
};

export default AuthLayout;
