import { useNavigate } from "react-router-dom";
import * as React from 'react'
import { useState, useEffect } from "react";
import { login, forgotPassword, checkIfAdminExists } from "../firebase/config"; // Added checkIfAdminExists
import { toast } from "react-toastify";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

const _LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState(true); // Default to true to hide link initially

  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const exists = await checkIfAdminExists();
      setAdminExists(exists);
    };
    checkAdmin();
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    // Trim and lowercase for consistency
    const safeEmail = email.trim().toLowerCase();
    const result = await login(safeEmail, password); 

    if (result && result.user) {
      // Direct navigation based on role from DB
      if (result.role === 'superadmin') {
        navigate('/'); // Go to SuperAdmin Stats Dashboard
      } else if (result.role === 'admin') {
        navigate('/system-users'); // Go to Admin User Management
      } else {
        navigate('/'); // Default User Dashboard
      }
      toast.success(`Welcome back, ${result.user.displayName || 'User'}!`);
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      return toast.error("Please enter your email first.");
    }

    setLoading(true);
    try {
        const safeEmail = email.trim().toLowerCase();
        await forgotPassword(safeEmail);
    } finally {
        setLoading(false);
    }
  };

  const handleSuperAdminRegister = () => {
    if (adminExists) {
      toast.error("Superadmin is already existed");
    } else {
      navigate("/admin-register-gate");
    }
  };

  return (
      <div className='bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl px-5 py-8 sm:px-10 sm:py-10 lg:py-16 rounded-[2rem] lg:rounded-[2.5rem] border-2 border-violet-500/20 shadow-2xl transition-all duration-300 animate-fade-in-up animate-border-glow'>

        <div className="flex flex-col items-center mb-5 lg:mb-8">
          <div className="p-3 lg:p-4 bg-violet-600 rounded-2xl shadow-lg shadow-violet-500/20 mb-3 lg:mb-4 transform hover:rotate-6 transition-transform">
            <ShieldCheck className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
          </div>
          <h1 className='text-2xl lg:text-3xl font-black text-center text-gray-900 dark:text-white tracking-tight'>
            Anomaly <span className="text-violet-600">Detection</span> System
          </h1>
        </div>

        <form onSubmit={handleLogin} className='space-y-4 lg:space-y-5'>
            <div>
             <label htmlFor="email" className='text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 ml-1'>Email Address</label>
             <div className="relative mt-1.5 lg:mt-2 group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <Mail className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
               </div>
               <input
                 id="email"
                 required
                 type="email"
                 className='w-full pl-10 lg:pl-11 pr-4 py-3 lg:py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl lg:rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 font-medium text-sm lg:text-base'
                 onChange={(e)=>{setEmail(e.target.value)}} 
                 value={email} 
                 placeholder='Enter your email'  
               />
             </div>
           </div>

           <div>
             <label htmlFor="password" className='text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 ml-1'>Password</label>
             <div className="relative mt-1.5 lg:mt-2 group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <Lock className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                 </div>
                 <input
                   id="password"
                   required
                   type={showPassword ? "text" : "password"} 
                   className='w-full pl-10 lg:pl-11 pr-12 py-3 lg:py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl lg:rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 font-medium text-sm lg:text-base'
                   onChange={(e) => { setPassword(e.target.value) }} 
                   value={password} 
                   placeholder='Enter your password'  
                 />
                 <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-violet-500 transition-colors"
                 >
                     {showPassword ? <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Eye className="w-4 h-4 lg:w-5 lg:h-5" />}
                 </button>
             </div>
           </div>

           <div className='pt-2 lg:pt-4'>
            <button 
              type="submit"
              disabled={loading}
              className='w-full py-3.5 lg:py-4 rounded-xl lg:rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-base lg:text-lg font-bold shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 lg:gap-3'
            >
              {loading ? (
                <Loader2 className="w-5 h-5 lg:w-6 lg:h-6 animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" /></>
              )}
            </button>
          </div>
        </form>

        <div className='mt-6 lg:mt-8 flex flex-col items-center gap-3 lg:gap-4'>
          <button 
            type="button"
            onClick={handleForgotPassword} 
            className='font-bold text-xs lg:text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all flex items-center gap-1 group'
          >
            Forgot password?
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
          </button>

          <div className="w-full flex items-center gap-3 lg:gap-4 py-1 lg:py-2">
            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
            <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Management</span>
            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
          </div>

          <button 
            type="button"
            onClick={handleSuperAdminRegister} 
            className='w-full font-bold text-[10px] lg:text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-4 py-3 lg:py-3.5 rounded-lg lg:rounded-xl border border-violet-100 dark:border-violet-900/50 transition-all hover:bg-violet-100 dark:hover:bg-violet-900/50 active:scale-95'
          >
            Initialize Super Admin
          </button>
        </div>
      </div>  
  );
};

export default _LoginForm;