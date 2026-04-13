import React, { useEffect, useState } from "react";
import { 
  getAllUsers, createUserEntry, updateUserEntry, deleteUserEntry, 
  sendAdminVerificationCode, verifyAdminCode 
} from "../../firebase/config";
import { FaUserGroup, FaEnvelope, FaPen, FaTrash, FaPlus, FaXmark } from "react-icons/fa6";
import { toast } from "react-toastify";
import useAuthStatus from "../../hooks/useAuthStatus"; 
import { db } from "../../firebase/config";
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
    if (codeExpiry <= 0) {
        setCodeSent(false);
        return;
    }
    const timer = setInterval(() => setCodeExpiry(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [codeExpiry]);

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
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen relative">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4 sm:gap-0">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">System Users</h1>
                <p className="text-gray-500 text-sm">Manage authorized standard users and co-admins.</p>
            </div>
            <button 
                onClick={handleOpenAdd}
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
                <FaPlus /> Add User
            </button>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col max-h-[70vh]"> 
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center gap-3 bg-white z-10">
            <div className="p-3 bg-violet-100 rounded-xl text-violet-500">
                <FaUserGroup className="text-xl" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-800">Authorized Users</h2>
                <p className="text-sm text-gray-500">
                    Total manageable accounts: {users.length}
                </p>
            </div>
          </div>

          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-violet-200">
            {loading ? (
                <div className="p-8 text-center text-gray-400">Loading directory...</div>
            ) : users.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No users found.</div>
            ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                      <thead className="bg-gray-50 text-gray-500 font-medium text-sm sticky top-0 z-10">
                          <tr>
                              <th className="p-3 sm:p-4 pl-4 sm:pl-6">User Profile</th>
                              <th className="p-3 sm:p-4">Email Address</th>
                              <th className="p-3 sm:p-4">Role</th>
                              <th className="p-3 sm:p-4 text-center">Manage</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {users.map((user) => (
                              <tr key={user.id} className="hover:bg-violet-50/50 transition-colors group">
                                  <td className="p-2 sm:p-4 pl-2 sm:pl-6 flex items-center gap-2 sm:gap-3">
                                      <img 
                                          src={user.photoURL || `https://api.dicebear.com/9.x/initials/svg?seed=${user.username || "User"}`} 
                                          alt="avatar" 
                                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 object-cover border border-gray-200"
                                      />
                                      <span className="font-semibold text-gray-700 text-sm sm:text-base">{user.username || "Unknown"}</span>
                                  </td>
                                  <td className="p-2 sm:p-4 text-gray-600 text-xs sm:text-sm">
                                      <div className="flex items-center gap-1 sm:gap-2">
                                          <FaEnvelope className="text-gray-300" /> {user.email}
                                      </div>
                                  </td>
                                  <td className="p-2 sm:p-4">
                                      <span className={`inline-block px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] uppercase tracking-wider font-bold rounded-full 
                                          ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                          {user.role || 'user'}
                                      </span>
                                  </td>
                                  <td className="p-2 sm:p-4 text-center">
                                      <div className="flex justify-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => handleOpenEdit(user)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg"><FaPen /></button>
                                          <button onClick={() => openDeleteModal(user.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><FaTrash /></button>
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
            <div className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl scale-in-center">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{currentAction === "add" ? "New Account" : "Update Account"}</h2>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><FaXmark className="text-xl text-gray-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Username</label>
                        <input required type="text" className="w-full border-2 border-gray-100 p-2 sm:p-3 rounded-xl mt-1 outline-none focus:border-violet-500 transition-all" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Email Address</label>
                        <input required type="email" className="w-full border-2 border-gray-100 p-2 sm:p-3 rounded-xl mt-1 outline-none focus:border-violet-500 transition-all" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                    
                    {/* Access Level - Locked for Admins */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Access Level</label>
                        {userRole === "admin" ? (
                            <div className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-xl mt-1 text-gray-600 font-bold flex items-center gap-2 select-none">
                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                Standard User
                            </div>
                        ) : (
                            <select 
                                className="w-full border-2 border-gray-100 p-2 sm:p-3 rounded-xl mt-1 outline-none focus:border-violet-500 transition-all font-semibold text-gray-700" 
                                value={formData.role} 
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                            >
                                <option value="user">Standard User</option>
                                <option value="admin">Administrator</option>
                            </select>
                        )}
                        {userRole === "admin" && (
                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tight">
                                Role management is restricted to Household Admin.
                            </p>
                        )}
                    </div>
                    
                    {/* SHOW VERIFICATION FOR BOTH ADD AND EDIT */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Email Verification</label>
                        <div className="flex gap-2 mt-1">
                            <button
                            type="button"
                            onClick={handleSendCode}
                            disabled={codeLoading || codeExpiry > 0}
                            className="px-4 py-2 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50"
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
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Verification Code</label>
                        <input
                        type="text"
                        required
                        className="w-full border-2 border-gray-100 p-2 sm:p-3 rounded-xl mt-1"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        />

                        {codeExpiry <= 0 && (
                        <p className="text-xs text-red-500 mt-1">
                            Verification code expired. Please resend.
                        </p>
                        )}
                    </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">
                            Temporary Password
                        </label>
                        <input
                            required={currentAction === "add"}
                            type="text"
                            placeholder={currentAction === "edit" ? "Leave blank to keep current" : ""}
                            className="w-full border-2 border-gray-100 p-2 sm:p-3 rounded-xl mt-1 outline-none focus:border-violet-500 transition-all"
                            value={formData.password}
                            onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                            }
                        />
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">
                            Must be at least 6 characters
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-6 py-3 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting} 
                            className="flex-[2] bg-violet-600 hover:bg-violet-700 text-white py-3 sm:py-4 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-violet-100"
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