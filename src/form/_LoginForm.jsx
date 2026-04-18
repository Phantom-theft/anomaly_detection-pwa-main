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
      <div className='bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl px-6 py-10 sm:px-10 sm:py-16 rounded-[2.5rem] border-2 border-violet-500/20 shadow-2xl transition-all duration-300 animate-fade-in-up animate-border-glow'>

        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-violet-600 rounded-2xl shadow-lg shadow-violet-500/20 mb-4 transform hover:rotate-6 transition-transform">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className='text-3xl font-black text-center text-gray-900 dark:text-white tracking-tight'>
            Secure <span className="text-violet-600">Access</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-sm">Anomaly Detection System</p>
        </div>

        <form onSubmit={handleLogin} className='space-y-5'>
            <div>
             <label htmlFor="email" className='text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 ml-1'>Email Address</label>
             <div className="relative mt-2 group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
               </div>
               <input
                 id="email"
                 required
                 type="email"
                 className='w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 font-medium'
                 onChange={(e)=>{setEmail(e.target.value)}} 
                 value={email} 
                 placeholder='Enter your email'  
               />
             </div>
           </div>

           <div>
             <label htmlFor="password" className='text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 ml-1'>Password</label>
             <div className="relative mt-2 group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                 </div>
                 <input
                   id="password"
                   required
                   type={showPassword ? "text" : "password"} 
                   className='w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 font-medium'
                   onChange={(e) => { setPassword(e.target.value) }} 
                   value={password} 
                   placeholder='Enter your password'  
                 />
                 <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-violet-500 transition-colors"
                 >
                     {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
             </div>
           </div>

           <div className='pt-4'>
            <button 
              type="submit"
              disabled={loading}
              className='w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-lg font-bold shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3'
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </form>

        <div className='mt-8 flex flex-col items-center gap-4'>
          <button 
            type="button"
            onClick={handleForgotPassword} 
            className='font-bold text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors'
          >
            Forgot password?
          </button>

          <div className="w-full flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Management</span>
            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
          </div>

          <button 
            type="button"
            onClick={handleSuperAdminRegister} 
            className='w-full font-bold text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-4 py-3.5 rounded-xl border border-violet-100 dark:border-violet-900/50 transition-all hover:bg-violet-100 dark:hover:bg-violet-900/50 active:scale-95'
          >
            Initialize Super Admin
          </button>
        </div>
      </div>  
  );
};

export default _LoginForm;