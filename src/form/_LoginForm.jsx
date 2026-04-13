import { useNavigate } from "react-router-dom";
import * as React from 'react'
import { useState, useEffect } from "react";
import { login, forgotPassword, checkIfAdminExists } from "../firebase/config"; // Added checkIfAdminExists
import { toast } from "react-toastify";

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
      <div className='bg-white dark:bg-gray-800 px-10 py-20 rounded-3xl border-2 border-gray-200 dark:border-gray-700 shadow-lg transition-colors duration-300'>

        <h1 className='text-3xl font-semibold mb-4 text-gray-900 dark:text-white'>Anomaly Detection System</h1>

        <form onSubmit={handleLogin} className='mt-8'>
            <div>
             <label htmlFor="email" className='text-lg font-medium text-gray-700 dark:text-gray-200'>Email</label>
             <input
               id="email"
               required
               type="email"
               className='w-full border-2 border-gray-100 dark:border-gray-700 rounded-xl p-2 mt-1 bg-transparent text-gray-900 dark:text-white'
               onChange={(e)=>{setEmail(e.target.value)}} 
               value={email} 
               placeholder='Enter your email'  
             />
           </div>

           <div className="mt-4">
             <label htmlFor="password" className='text-lg font-medium text-gray-700 dark:text-gray-200'>Password</label>
             <div className="relative">
                 <input
                   id="password"
                   required
                   type={showPassword ? "text" : "password"} 
                   className='w-full border-2 border-gray-100 dark:border-gray-700 rounded-xl p-2 mt-1 bg-transparent pr-10 text-gray-900 dark:text-white'
                   onChange={(e) => { setPassword(e.target.value) }} 
                   value={password} 
                   placeholder='Enter your password'  
                 />
                 <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-4 text-gray-500 hover:text-violet-500"
                 >
                     {showPassword ? (
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                             <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                         </svg>
                     ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                         </svg>
                     )}
                 </button>
             </div>
           </div>

           <div className='mt-8 flex flex-col gap-y-4'>
            <button 
              type="submit"
              disabled={loading}
              className='py-2 rounded-xl bg-violet-500 text-white text-lg font-bold hover:bg-violet-600 transition-colors disabled:opacity-50'
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <div className='mt-4 flex flex-col items-center gap-2'>
          <button 
            type="button"
            onClick={handleForgotPassword} 
            className='font-medium text-base text-violet-500 hover:underline'
          >
            Forgot password?
          </button>

          <button 
            type="button"
            onClick={handleSuperAdminRegister} 
            className='mt-2 font-bold text-sm text-violet-600 hover:text-violet-700 bg-violet-50 px-4 py-2 rounded-lg border border-violet-100 transition-all active:scale-95'
          >
            Register Super Admin
          </button>
        </div>
        </div>  
        );
        };

        export default _LoginForm;