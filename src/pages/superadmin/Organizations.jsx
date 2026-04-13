import React, { useEffect, useState } from "react";
import { 
  getAllUsers, createUserEntry, updateUserEntry, deleteUserEntry, 
  sendAdminVerificationCode, verifyAdminCode, db 
} from "../../firebase/config"; 
import { doc, setDoc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { FaBuildingShield, FaUserTie, FaUser, FaPlus, FaXmark, FaPen, FaTrash } from "react-icons/fa6";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/ConfirmModal";

const Organizations = () => {
  const [organizations, setOrganizations] = useState([]); 
  const [allUsers, setAllUsers] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [currentAction, setCurrentAction] = useState("add"); // "add" or "edit"
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // OTP States
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeExpiry, setCodeExpiry] = useState(0);

  const [formData, setFormData] = useState({ 
      orgName: "", 
      username: "", 
      email: "", 
      password: ""
  });

  useEffect(() => {
    if (codeExpiry <= 0) {
        setCodeSent(false);
        return;
    }
    const timer = setInterval(() => setCodeExpiry(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [codeExpiry]);

  // NA-UPDATE: KUKUNIN NA NATIN ANG DATA MULA SA "organizations" COLLECTION
  const fetchOrgData = async () => {
    setLoading(true);
    try {
      // 1. Kunin lahat ng users
      const fetchedUsers = await getAllUsers();
      setAllUsers(fetchedUsers);

      // 2. Kunin lahat ng organizations mula sa database
      const orgsSnapshot = await getDocs(collection(db, "organizations"));
      const orgsData = orgsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrganizations(orgsData);
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgData();
  }, []);

  const handleOpenAdd = () => {
    setCurrentAction("add");
    setFormData({ orgName: "", username: "", email: "", password: "" });
    setCode("");
    setCodeSent(false);
    setCodeExpiry(0);
    setIsModalOpen(true);
  };

  // BAGONG FUNCTION PARA SA PAG-EDIT
  const handleOpenEdit = (org, adminUser) => {
    setCurrentAction("edit");
    setSelectedOrg(org);
    setSelectedAdmin(adminUser); // Pwedeng null kung walang nakitang admin
    setFormData({ 
        orgName: org.org_name || "", 
        username: adminUser ? adminUser.username : org.admin_name || "", 
        email: adminUser ? adminUser.email : org.admin_email || "", 
        password: "" 
    });
    setIsModalOpen(true);
  };

  // MODAL HANDLERS PARA SA PAG-DELETE
  const openDeleteModal = (org, adminUser) => {
    setDeleteTarget({ org, adminUser });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { org } = deleteTarget;
    
    setDeleteLoading(true);
    try {
        // 1. Hanapin lahat ng users (admin at regular users) na kabilang sa organization na ito
        const targetOrgId = org.org_id || org.id;
        const usersToDelete = allUsers.filter((u) => u.org_id === targetOrgId);

        // 2. Burahin ang bawat user sa Users Collection at Firebase Auth
        for (const user of usersToDelete) {
            await deleteUserEntry(user.id);
        }

        // 3. Burahin sa Organizations Collection
        await deleteDoc(doc(db, "organizations", org.id));
        
        toast.success("Organization and all associated users removed.");
        fetchOrgData(); // Refresh list
    } catch (error) {
        console.error("Delete Error:", error);
        toast.error("Failed to delete organization.");
    } finally {
        setDeleteLoading(false);
        setIsConfirmOpen(false);
        setDeleteTarget(null);
    }
  };

  const handleSendCode = async () => {
    if (!formData.email) return toast.warning("Enter email first.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.orgName.trim() || !formData.username.trim() || !formData.email.trim()) {
        return toast.error("Please fill in all required fields.");
    }

    setIsConfirmSaveOpen(true);
  };

  const handleConfirmSave = async () => {
    setSubmitting(true);

    try {
        if (currentAction === "add") {
            // -- ADD LOGIC --
            if (!codeSent || codeExpiry <= 0) {
                toast.error("Email verification required.");
                setSubmitting(false);
                setIsConfirmSaveOpen(false);
                return;
            }

            const verified = await verifyAdminCode(formData.email.trim().toLowerCase(), code);
            if (!verified) {
                toast.error("Invalid or expired verification code.");
                setSubmitting(false);
                setIsConfirmSaveOpen(false);
                return;
            }

            if (formData.password.length < 6) {
                toast.warning("Password must be at least 6 characters");
                setSubmitting(false);
                setIsConfirmSaveOpen(false);
                return;
            }

            const newOrgId = `org_${Date.now()}`;
            const userData = {
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                role: "admin", 
                org_id: newOrgId 
            };

            const success = await createUserEntry(userData, formData.password);

            if (success) {
                await setDoc(doc(db, "organizations", newOrgId), {
                    org_id: newOrgId,
                    org_name: formData.orgName.trim(),
                    admin_name: formData.username.trim(),
                    admin_email: formData.email.trim().toLowerCase(),
                    createdAt: new Date(),
                    status: "active"
                });
                
                setIsModalOpen(false);
                setIsConfirmSaveOpen(false);
                fetchOrgData(); 
                toast.success("New Organization and Admin created!");
            }
        } else {
            // -- EDIT LOGIC --
            // 1. Update ang Organizations Collection
            await updateDoc(doc(db, "organizations", selectedOrg.id), {
                org_name: formData.orgName.trim(),
                admin_name: formData.username.trim(),
                admin_email: formData.email.trim().toLowerCase()
            });

            // 2. Update ang Admin Profile sa Users Collection kung mayroon
            if (selectedAdmin) {
                await updateUserEntry(selectedAdmin.id, {
                    username: formData.username.trim(),
                    email: formData.email.trim().toLowerCase()
                });
            }

            setIsModalOpen(false);
            setIsConfirmSaveOpen(false);
            fetchOrgData(); 
            toast.success("Organization details updated!");
        }
    } catch (err) {
        console.error("Submission Error:", err);
        toast.error("An error occurred. Please try again.");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">Organizations Directory</h1>
            <p className="text-gray-500 text-sm">SuperAdmin View: Manage households, admins, and their registered users.</p>
          </div>
          <button 
                onClick={handleOpenAdd}
                className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
                <FaPlus /> Add Organization
          </button>
        </div>

        {loading ? (
          <div className="text-center p-10 text-gray-400 font-medium">Loading organizations...</div>
        ) : organizations.length === 0 ? (
          <div className="text-center p-10 text-gray-400 font-medium bg-white rounded-3xl border border-dashed border-gray-300">
             No organizations found. Click "Add Organization" to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {organizations.map((org) => {
              // Hahanapin ang Admin User na naka-link sa Org na ito
              const adminUser = allUsers.find((u) => u.org_id === org.org_id && u.role === "admin");
              // Hahanapin ang mga Standard Users na naka-link sa Org na ito
              const orgUsers = allUsers.filter((u) => u.org_id === org.org_id && u.role === "user");

              return (
                <div key={org.id} className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden relative group">
                  
                  {/* Action Buttons (Edit & Delete) - Lalabas kapag naka-hover */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => handleOpenEdit(org, adminUser)} className="p-2 bg-white/20 hover:bg-white/40 text-white backdrop-blur-md rounded-lg transition-colors">
                          <FaPen className="text-sm" />
                      </button>
                      <button onClick={() => openDeleteModal(org, adminUser)} className="p-2 bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-md rounded-lg transition-colors">
                          <FaTrash className="text-sm" />
                      </button>
                  </div>

                  <div className="bg-violet-600 p-5 text-white flex items-start gap-4 pr-24">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
                      <FaBuildingShield className="text-2xl" />
                    </div>
                    <div className="overflow-hidden">
                      <h2 className="text-xl font-bold tracking-wide truncate">
                        {org.org_name || "Unnamed Organization"}
                      </h2>
                      <div className="flex flex-col gap-1 mt-1 text-violet-100 text-sm">
                        <div className="flex items-center gap-2">
                            <FaUserTie className="shrink-0" />
                            <span className="truncate">Admin: {adminUser ? adminUser.username : org.admin_name || 'N/A'}</span>
                        </div>
                        <span className="truncate text-xs text-violet-300 ml-5">{adminUser ? adminUser.email : org.admin_email || 'N/A'}</span>
                      </div>
                      <span className="inline-block mt-2 px-2 py-1 bg-violet-800/50 text-[10px] uppercase font-bold rounded-lg border border-violet-500/30">
                        Org ID: {org.org_id || 'Missing ID'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Registered Users ({orgUsers.length})
                    </h3>
                    
                    {orgUsers.length === 0 ? (
                      <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
                        No standard users added yet.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {orgUsers.map((user) => (
                          <li key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-violet-200 transition-colors">
                            <div className="bg-gray-200 p-2 rounded-full text-gray-500 shrink-0">
                              <FaUser className="text-sm" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-semibold text-gray-800 text-sm truncate">{user.username}</p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl scale-in-center mt-10 mb-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                            {currentAction === "add" ? "New Organization" : "Update Organization"}
                        </h2>
                        <p className="text-xs text-gray-500">
                            {currentAction === "add" ? "Create a landlord/admin and their household." : "Edit business name and admin details."}
                        </p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><FaXmark className="text-xl text-gray-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl mb-4">
                        <label className="text-xs font-bold text-violet-600 uppercase">Organization / House Name</label>
                        <input required type="text" placeholder="e.g. Realino Apartments" className="w-full bg-transparent p-2 mt-1 outline-none text-gray-800 font-semibold" value={formData.orgName} onChange={(e) => setFormData({...formData, orgName: e.target.value})} />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Admin Username</label>
                        <input required type="text" className="w-full border-2 border-gray-100 p-2 sm:p-3 rounded-xl mt-1 outline-none focus:border-violet-500 transition-all" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Admin Email Address</label>
                        <input required type="email" className="w-full border-2 border-gray-100 p-2 sm:p-3 rounded-xl mt-1 outline-none focus:border-violet-500 transition-all" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                    
                    {/* ITATAGO NATIN ANG OTP AT PASSWORD KAPAG EDIT MODE NA LANG */}
                    {currentAction === "add" && (
                        <>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Email Verification</label>
                                <div className="flex gap-2 mt-1">
                                    <button type="button" onClick={handleSendCode} disabled={codeLoading || codeExpiry > 0} className="px-4 py-2 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50">
                                    {codeLoading ? "Sending..." : codeExpiry > 0 ? `Resend in ${codeExpiry}s` : "Send Code"}
                                    </button>
                                </div>
                            </div>

                            {codeSent && (
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Verification Code</label>
                                <input type="text" required className="w-full border-2 border-gray-100 p-2 sm:p-3 rounded-xl mt-1" value={code} onChange={(e) => setCode(e.target.value)} />
                                {codeExpiry <= 0 && <p className="text-xs text-red-500 mt-1">Verification code expired. Please resend.</p>}
                            </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Temporary Admin Password</label>
                                <input required type="text" className="w-full border-2 border-gray-100 p-2 sm:p-3 rounded-xl mt-1 outline-none focus:border-violet-500 transition-all" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                        </>
                    )}

                    <button type="submit" disabled={submitting} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 sm:py-4 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-violet-100 mt-4">
                        {submitting ? "Processing..." : currentAction === "add" ? "Create Organization" : "Save Changes"}
                    </button>
                </form>
            </div>
        </div>
        )}

        <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Organization"
        confirmText="Delete Permanently"
        type="danger"
        message={`Are you sure you want to delete ${deleteTarget?.org?.org_name || 'this organization'}? This will also permanently remove the linked Admin account.`}
        />

        <ConfirmModal 
        isOpen={isConfirmSaveOpen} 
        onClose={() => setIsConfirmSaveOpen(false)} 
        onConfirm={handleConfirmSave}
        loading={submitting}
        title={currentAction === "add" ? "Create Organization" : "Save Changes"}
        confirmText={currentAction === "add" ? "Create Now" : "Save Changes"}
        type="primary"
        message={`Are you sure you want to ${currentAction === "add" ? "create" : "update"} ${formData.orgName}?`}
        />
        </div>
        );
        };

        export default Organizations;