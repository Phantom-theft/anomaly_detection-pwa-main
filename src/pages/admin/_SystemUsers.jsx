/* eslint-disable */
import React, { useEffect, useState } from "react";
import { 
  getAllUsers, createUserEntry, updateUserEntry, deleteUserEntry, 
  sendAdminVerificationCode, verifyAdminCode, db
} from "../../firebase/config";
import { FaUserGroup, FaEnvelope, FaPen, FaTrash, FaPlus, FaXmark } from "react-icons/fa6";
import { CheckCheck, Eye, EyeOff, X } from 'lucide-react';
import { toast } from "react-toastify";
import useAuthStatus from "../../hooks/useAuthStatus"; 

// --- PASSWORD POLICY DESIGN CONSTANTS ---
const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, text: 'At least 8 characters' },
  { regex: /[0-9]/, text: 'At least 1 number' },
  { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
  { regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
  { regex: /[!-/:-@[-`{-~]/, text: 'At least 1 special character' },
];

const STRENGTH_TEXTS = {
  0: 'Enter a password',
  1: 'Weak password',
  2: 'Medium password!',
  3: 'Strong password!!',
  4: 'Very Strong password!!!',
  5: 'Perfect password!!!!',
};

import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import ConfirmModal from "../../components/ConfirmModal";

const SystemUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState(null); 
  
  const { user: currentUser } = useAuthStatus(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [currentAction, setCurrentAction] = useState("add"); 
  const [selectedUser, setSelectedUser] = useState(null);

  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeExpiry, setCodeExpiry] = useState(0);

  useEffect(() => {
    if (codeExpiry > 0) {
      const timer = setInterval(() => setCodeExpiry(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (codeSent) {
      // Hides the OTP boxes ONLY when it truly hits 0
      setCodeSent(false);
    }
  }, [codeExpiry, codeSent]);

  const handleSendCode = async () => {
    if (!formData.email) return toast.warning("Enter email first.");

    const emailLower = formData.email.trim().toLowerCase();

    // GLOBAL CHECK: Check if email exists in the entire system
    try {
        const q = query(collection(db, "users"), where("email", "==", emailLower));
        const querySnapshot = await getDocs(q);
        
        // If results found, check if it's NOT the user we are currently editing
        const isDuplicate = querySnapshot.docs.some(doc => 
            currentAction === "add" || doc.id !== selectedUser.id
        );

        if (isDuplicate) {
            return toast.error("This email is already registered to another user.");
        }
    } catch (error) {
        console.error("Email check error:", error);
    }

    setCodeLoading(true);
    const success = await sendAdminVerificationCode(formData.email);
    setCodeLoading(false);

    if (success) {
      toast.success("Verification code sent!");
      setCodeSent(true);
      setCodeExpiry(30);
      setOtp(Array(6).fill("")); // Clear old boxes
      setCode("");               // Clear old joined code
    } else {
      toast.error("Failed to send code.");
    }
  };

  const [formData, setFormData] = useState({ 
      username: "", 
      email: "", 
      password: "", 
      role: "user" 
  });

  const [otp, setOtp] = useState(Array(6).fill(""));

  useEffect(() => {
    setCode(otp.join(""));
  }, [otp]);

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pastedData.length === 6 && pastedData.every(char => !isNaN(char))) {
      setOtp(pastedData);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  const calculateStrength = React.useMemo(() => {
    const requirements = PASSWORD_REQUIREMENTS.map((req) => ({
      met: req.regex.test(formData.password),
      text: req.text,
    }));

    return {
      score: requirements.filter((req) => req.met).length,
      requirements,
    };
  }, [formData.password]);

  // NA-UPDATE NA REFRESH USERS PARA SA SECURITY
  const refreshUsers = async () => {
    if (!currentUser) return; 

    setLoading(true);
    const data = await getAllUsers();

    const currentLoggedInUser = data.find(u => u.id === currentUser.uid);
    const role = currentLoggedInUser?.role;
    const myOrgId = currentLoggedInUser?.org_id; // Kukunin ang Org ID mo
    setUserRole(role); 

    let displayUsers = data;

    // KUNG ADMIN ANG NAKALOG-IN, MAKIKITA NIYA LANG ANG KA-ORG NIYA (Admin + Users)
    if (role === "admin") {
    // Kunin ang org_id ng current admin
    const currentAdmin = data.find(u => u.id === currentUser.uid);
    const myOrgId = currentAdmin?.org_id;

    // I-filter: same org lang, at walang superadmin
    displayUsers = data.filter(u =>
        u.org_id === myOrgId && u.role !== "superadmin"
    );
    }

    setUsers(displayUsers);
    setLoading(false);
  };

  useEffect(() => {
    refreshUsers();
  }, [currentUser]); 

  const handleOpenAdd = () => {
    setCurrentAction("add");
    setFormData({ username: "", email: "", password: "", role: "user" }); 
    setCode("");
    setCodeSent(false);
    setCodeExpiry(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setCurrentAction("edit");
    setSelectedUser(user);
    setFormData({ 
        username: user.username || "", 
        email: user.email || "", 
        password: "", 
        role: user.role || 'user' 
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (id) => {
    if (currentUser && id === currentUser.uid) {
        toast.error("You cannot delete your own account!");
        return;
    }
    setDeleteTarget(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const success = await deleteUserEntry(deleteTarget);
    if (success) {
        refreshUsers();
        toast.success("User removed successfully.");
    }
    setDeleteLoading(false);
    setIsConfirmOpen(false);
    setDeleteTarget(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.username.trim() || !formData.email.trim()) {
        return toast.error("All fields are required.");
    }

    // CHECK IF EMAIL EXISTS (excluding current user if editing)
    const emailLower = formData.email.trim().toLowerCase();
    const emailConflict = users.find(u => 
        u.email?.toLowerCase() === emailLower && 
        (currentAction === "add" || u.id !== selectedUser.id)
    );

    if (emailConflict) {
        return toast.error("This email is already registered to another user.");
    }

    // verification check for both add and edit
    if (!codeSent || codeExpiry <= 0) {
        return toast.error("Email verification required.");
    }

    if (currentAction === "add" && formData.password.length < 6) {
        return toast.warning("Password must be at least 6 characters");
    }

    setIsConfirmSaveOpen(true);
  };

  const handleConfirmSave = async () => {
    setSubmitting(true);
    let success = false;

    try {
        // Shared Verification Logic for security
        const verified = await verifyAdminCode(formData.email.trim().toLowerCase(), code);
        if (!verified) {
            toast.error("Invalid or expired verification code.");
            setSubmitting(false);
            setIsConfirmSaveOpen(false);
            return;
        }

        if (currentAction === "add") {
            const adminDocRef = doc(db, "users", currentUser.uid);
            const adminSnap = await getDoc(adminDocRef);
            
            let adminOrgId = null;
            if (adminSnap.exists()) {
                adminOrgId = adminSnap.data().org_id; 
            }
            
             const userData = {
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                role: formData.role,
                org_id: adminOrgId
            };

            success = await createUserEntry(userData, formData.password);

        } else {
            success = await updateUserEntry(selectedUser.id, {
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                role: formData.role 
            });
        }

        if (success) {
            setIsModalOpen(false);
            refreshUsers();
            toast.success(currentAction === "add" ? "User created successfully!" : "User updated successfully!");
        }
    } catch (err) {
        console.error("Submission Error:", err);
        toast.error("Failed to save changes.");
    } finally {
        setSubmitting(false);
        setIsConfirmSaveOpen(false);
    }
  };

  return (
    <div className="p-3 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen relative transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-1">System Users</h1>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Manage authorized standard users and co-admins.</p>
            </div>
            <button 
                onClick={handleOpenAdd}
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
                <FaPlus /> Add User
            </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col md:max-h-[70vh] transition-colors"> 
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800 z-10">
            <div className="p-2.5 sm:p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl text-violet-500 dark:text-violet-400">
                <FaUserGroup className="text-lg sm:text-xl" />
            </div>
            <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">Authorized Users</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Total manageable accounts: {users.length}
                </p>
            </div>
          </div>

          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-violet-200 dark:scrollbar-thumb-violet-900">
            {loading ? (
                <div className="p-10 text-center text-gray-400 font-medium animate-pulse">Loading directory...</div>
            ) : users.length === 0 ? (
                <div className="p-10 text-center text-gray-400">No users found.</div>
            ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left whitespace-nowrap">
                      <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest sticky top-0 z-10">
                          <tr>
                              <th className="p-3 sm:p-4 pl-5 sm:pl-6">User Profile</th>
                              <th className="p-3 sm:p-4">Email Address</th>
                              <th className="p-3 sm:p-4">Role</th>
                              <th className="p-3 sm:p-4 text-center">Manage</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {users.map((user) => (
                              <tr key={user.id} className="hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors group">
                                  <td className="p-3 sm:p-4 pl-5 sm:pl-6">
                                      <div className="flex items-center gap-2 sm:gap-3">
                                          <img 
                                              src={user.photoURL || `https://api.dicebear.com/9.x/initials/svg?seed=${user.username || "User"}`} 
                                              alt="avatar" 
                                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-gray-700 object-cover border border-gray-200 dark:border-gray-600"
                                          />
                                          <span className="font-bold text-gray-700 dark:text-gray-200 text-sm sm:text-base">{user.username || "Unknown"}</span>
                                      </div>
                                  </td>
                                  <td className="p-3 sm:p-4 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                                      <div className="flex items-center gap-1.5 sm:gap-2">
                                          <FaEnvelope className="text-gray-300 dark:text-gray-600 flex-shrink-0" /> 
                                          <span className="truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none" title={user.email}>
                                              {user.email}
                                          </span>
                                      </div>
                                  </td>
                                  <td className="p-3 sm:p-4">
                                      <span className={`inline-block px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] uppercase tracking-wider font-bold rounded-full 
                                          ${user.role === 'superadmin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : user.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                                          {user.role || 'user'}
                                      </span>
                                  </td>
                                  <td className="p-3 sm:p-4 text-center">
                                      <div className="flex justify-center gap-1 sm:gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => handleOpenEdit(user)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg active:scale-90 transition-transform"><FaPen /></button>
                                          <button onClick={() => openDeleteModal(user.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg active:scale-90 transition-transform"><FaTrash /></button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete User"
        message="Are you sure you want to permanently remove this user? This action cannot be undone."
      />

      <ConfirmModal 
        isOpen={isConfirmSaveOpen} 
        onClose={() => setIsConfirmSaveOpen(false)} 
        onConfirm={handleConfirmSave}
        loading={submitting}
        title={currentAction === "add" ? "Create Account" : "Update Account"}
        confirmText={currentAction === "add" ? "Create User" : "Save Changes"}
        type="primary"
        message={`Are you sure you want to ${currentAction === "add" ? "create a new account for" : "save the changes for"} ${formData.username}?`}
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl scale-in-center transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{currentAction === "add" ? "New Account" : "Update Account"}</h2>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <FaXmark className="text-xl text-gray-400 dark:text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Username</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 p-2 sm:p-3 rounded-xl mt-1 outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-all" 
                            value={formData.username} 
                            onChange={(e) => setFormData({...formData, username: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Email Address</label>
                        <input 
                            required 
                            type="email" 
                            className="w-full border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 p-2 sm:p-3 rounded-xl mt-1 outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-all" 
                            value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        />
                    </div>
                    
                    {/* Access Level - Locked for Admins */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Access Level</label>
                        {userRole === "admin" ? (
                            <div className="w-full bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-100 dark:border-gray-700 p-3 rounded-xl mt-1 text-gray-600 dark:text-gray-400 font-bold flex items-center gap-2 select-none">
                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                Standard User
                            </div>
                        ) : (
                            <select 
                                className="w-full border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 p-2 sm:p-3 rounded-xl mt-1 outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-all font-semibold" 
                                value={formData.role} 
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                            >
                                <option value="user">Standard User</option>
                                <option value="admin">Administrator</option>
                            </select>
                        )}
                        {userRole === "admin" && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase font-bold tracking-tight">
                                Role management is restricted to Household Admin.
                            </p>
                        )}
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
                            Temporary Password
                        </label>
                        <div className="relative">
                            <input
                                required={currentAction === "add"}
                                type={showPassword ? "text" : "password"}
                                placeholder={currentAction === "edit" ? "Leave blank to keep current" : ""}
                                className="w-full border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 p-2 sm:p-3 rounded-xl mt-1 outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-all pr-12"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-500 transition-colors mt-0.5"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* STRENGTH BARS */}
                        <div className='flex gap-1.5 w-full justify-between mt-3'>
                            {[1, 2, 3, 4, 5].map((level) => (
                                <span
                                    key={level}
                                    className={`h-1.5 rounded-full w-full transition-colors duration-500 ${
                                        calculateStrength.score >= level 
                                            ? (calculateStrength.score <= 2 ? 'bg-red-400' : calculateStrength.score <= 4 ? 'bg-orange-400' : 'bg-emerald-500') 
                                            : 'bg-gray-100 dark:bg-gray-800'
                                    }`}
                                ></span>
                            ))}
                        </div>

                        <p className='my-2 text-[10px] font-bold uppercase flex justify-between'>
                            <span className="text-gray-400">Must contain:</span>
                            <span className={calculateStrength.score >= 4 ? 'text-emerald-500' : 'text-orange-500'}>
                                {STRENGTH_TEXTS[calculateStrength.score]}
                            </span>
                        </p>

                        {/* REQUIREMENTS CHECKLIST */}
                        <ul className='space-y-1.5 mt-2'>
                            {calculateStrength.requirements.map((req) => (
                                <li key={req.text} className='flex items-center space-x-2'>
                                    {req.met ? (
                                        <CheckCheck size={14} className='text-emerald-500' />
                                    ) : (
                                        <X size={14} className='text-gray-300 dark:text-gray-600' />
                                    )}
                                    <span className={`text-[10px] font-bold uppercase ${req.met ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {req.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* SHOW VERIFICATION FOR BOTH ADD AND EDIT */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Email Verification</label>
                        <div className="flex gap-2 mt-1">
                            <button
                                type="button"
                                onClick={handleSendCode}
                                disabled={codeLoading || codeExpiry > 0}
                                className="px-4 py-2 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 transition-opacity"
                            >
                                {codeLoading
                                    ? "Sending..."
                                    : codeExpiry > 0
                                    ? `Resend in ${codeExpiry}s`
                                    : "Send Code"}
                            </button>
                        </div>
                    </div>

                    {codeSent && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 mt-2">
                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                Verification Code
                            </label>
                            
                            <div className="flex items-center justify-between gap-2">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <React.Fragment key={index}>
                                        <input
                                            id={`otp-${index}`}
                                            type="text"
                                            maxLength={1}
                                            value={otp[index]}
                                            onChange={(e) => handleOtpChange(e.target.value, index)}
                                            onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                            onPaste={handleOtpPaste}
                                            className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-2xl border-2 transition-all outline-none focus:ring-4 focus:ring-violet-500/10 ${
                                                otp[index] 
                                                    ? "border-violet-500 bg-violet-50/30 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" 
                                                    : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-800 dark:text-white focus:border-violet-500 shadow-sm"
                                            }`}
                                        />
                                        {index === 2 && <span className="text-gray-300 dark:text-gray-600 font-bold px-1">-</span>}
                                    </React.Fragment>
                                ))}
                            </div>

                            <div className="flex justify-between items-center px-1">
                                <p className={`text-[10px] font-bold uppercase tracking-tight ${codeExpiry <= 0 ? "text-red-500" : "text-gray-400"}`}>
                                    {codeExpiry <= 0 ? "Code Expired" : `Expires in ${codeExpiry}s`}
                                </p>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        handleSendCode();
                                        setOtp(Array(6).fill(""));
                                    }}
                                    disabled={codeLoading || codeExpiry > 0}
                                    className="text-[10px] font-black uppercase text-violet-600 hover:text-violet-700 disabled:opacity-30 transition-all hover:underline"
                                >
                                    Resend New Code
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-6 py-3 rounded-2xl font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting} 
                            className="flex-[2] bg-violet-600 hover:bg-violet-700 text-white py-3 sm:py-4 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-violet-100 dark:shadow-none"
                        >
                            {submitting ? "Processing..." : currentAction === "add" ? "Create Account" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default SystemUsers;