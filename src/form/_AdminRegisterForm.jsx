import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch } from 'react-redux';
import { fetchUserData } from '../store/slices/authSlice';
// Pinalitan ang adminRegister ng superAdminRegister
import { superAdminRegister, sendAdminVerificationCode, verifyAdminCode } from "../firebase/config";
import AuthLayout from "../layouts/AuthLayout";
import { FaEye, FaEyeSlash } from "react-icons/fa6";

export default function AdminRegisterForm() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [code, setCode] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [codeLoading, setCodeLoading] = useState(false);
    const [codeExpiry, setCodeExpiry] = useState(0); 

    useEffect(() => {
        if (codeExpiry <= 0) {
            setCodeSent(false); 
            return;
        }

        const timer = setInterval(() => {
            setCodeExpiry(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [codeExpiry]);

    const handleSendCode = async () => {
        if (!email) return toast.warning("Please enter an email first.");

        setCodeLoading(true);
        const success = await sendAdminVerificationCode(email);
        setCodeLoading(false);

        if (success) {
            toast.success("Verification code sent to your email!");
            setCodeSent(true);
            setCodeExpiry(30); 
        } else {
            toast.error("Failed to send verification code. Try again.");
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!codeSent) return toast.warning("Please send verification code first.");
        if (codeExpiry <= 0) return toast.error("Verification code expired. Please resend.");

        setLoading(true);
        try {
            const verified = await verifyAdminCode(email, code);
            if (!verified) {
                toast.error("Invalid or expired verification code.");
                setLoading(false);
                return;
            }

            if (password.length < 6) {
                toast.warning("Password must be at least 6 characters.");
                setLoading(false);
                return;
            }

            // GINAMIT ANG superAdminRegister DITO
            const result = await superAdminRegister(username, email, password);
            if (result && result.user) {
                // Ensure Redux has the latest role before navigating
                await dispatch(fetchUserData(result.user));
                toast.success("Super Admin account created successfully!");
                navigate("/");
            }
        } catch (error) {
            console.error("Reg Error:", error);
            toast.error("Failed to create Super Admin.");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (sec) => {
        const minutes = Math.floor(sec / 60);
        const seconds = sec % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <AuthLayout>
            <div className='bg-white px-10 py-12 rounded-3xl border-2 border-gray-100 shadow-xl w-full max-w-[450px] relative z-10'>
                <h1 className='text-3xl font-semibold mb-2 text-violet-600'>Super Admin Setup</h1>
                <p className='font-medium text-gray-500 mb-8'>
                    Register the main system Super Administrator.
                </p>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className='text-lg font-medium text-gray-700'>Username</label>
                        <input
                            required
                            className='w-full border-2 border-gray-100 rounded-xl p-3 mt-1 outline-none focus:ring-2 focus:ring-violet-500'
                            placeholder='Full Name or Username'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className='text-lg font-medium text-gray-700'>Email</label>
                        <div className="flex gap-2">
                            <input
                                required
                                type="email"
                                className='flex-1 border-2 border-gray-100 rounded-xl p-3 mt-1 outline-none focus:ring-2 focus:ring-violet-500'
                                placeholder='superadmin@example.com'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={handleSendCode}
                                disabled={codeLoading || codeExpiry > 0}
                                className='px-4 py-3 mt-1 rounded-xl bg-violet-500 text-white font-bold hover:bg-violet-600 transition-all disabled:opacity-50'
                            >
                                {codeLoading
                                    ? "Sending..."
                                    : codeExpiry > 0
                                        ? `Resend in ${formatTime(codeExpiry)}`
                                        : "Send Code"}
                            </button>
                        </div>
                    </div>

                    {codeSent && (
                        <div>
                            <label className='text-lg font-medium text-gray-700'>Verification Code</label>
                            <input
                                required
                                type="text"
                                className='w-full border-2 border-gray-100 rounded-xl p-3 mt-1 outline-none focus:ring-2 focus:ring-violet-500'
                                placeholder='Enter code from email'
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                            {codeExpiry <= 0 && (
                                <p className="text-sm text-red-500 mt-1">
                                    Verification code expired. Please resend.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="relative">
                        <label className='text-lg font-medium text-gray-700'>Password</label>
                        <div className="relative">
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                className='w-full border-2 border-gray-100 rounded-xl p-3 mt-1 pr-12 outline-none focus:ring-2 focus:ring-violet-500'
                                placeholder='Create password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 mt-1"
                            >
                                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || codeExpiry <= 0}
                        className='w-full mt-6 py-3 rounded-xl bg-violet-600 text-white text-lg font-bold hover:bg-violet-700 transition-all disabled:opacity-50 shadow-lg'
                    >
                        {loading ? "Processing..." : "Register Super Admin"}
                    </button>

                    <div className='mt-6 text-center pt-4 border-t border-gray-50'>
                        <button 
                            type="button" 
                            onClick={() => navigate("/login")} 
                            className='text-violet-600 text-sm font-bold hover:underline'
                        >
                            Back to User Login
                        </button>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}