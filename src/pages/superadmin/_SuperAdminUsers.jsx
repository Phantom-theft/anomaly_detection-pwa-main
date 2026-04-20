import React, { useEffect, useState } from "react";
import { getAllUsers } from "../../firebase/config";
import { FaUserGroup, FaEnvelope } from "react-icons/fa6";

const SuperAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshUsers = async () => {
    setLoading(true);
    try {
        const data = await getAllUsers();
        // Ipakita lang ang admins at superadmins
        const adminsOnly = data.filter(u => u.role === "admin" || u.role === "superadmin");
        
        // I-sort alphabetically by username
        adminsOnly.sort((a, b) => (a.username || "").localeCompare(b.username || ""));

        setUsers(adminsOnly);
    } catch (error) {
        console.error("Error fetching users:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen relative">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">Platform Admin Directory</h1>
            <p className="text-gray-500 text-sm">Super Admin view: List of all registered system administrators.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col max-h-[75vh]"> 
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center gap-3 bg-white z-10">
            <div className="p-3 bg-violet-100 rounded-xl text-violet-500">
                <FaUserGroup className="text-xl" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-800">Administrator Records</h2>
                <p className="text-sm text-gray-500">Active Accounts: {users.length}</p>
            </div>
          </div>

          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-violet-200">
            {loading ? (
                <div className="p-8 text-center text-gray-400 font-medium">Loading records...</div>
            ) : users.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No administrator records found.</div>
            ) : (
                <>
                  {/* MOBILE LIST VIEW (Cards) */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {users.map((user) => (
                      <div key={user.id} className="p-4 flex flex-col gap-3 hover:bg-violet-50/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img 
                                src={user.photoURL || `https://api.dicebear.com/9.x/initials/svg?seed=${user.username || "User"}`} 
                                alt="avatar" 
                                className="w-10 h-10 rounded-full bg-gray-100 object-cover border border-gray-200"
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800">{user.username || "Unknown"}</span>
                              <span className={`inline-flex w-fit px-2 py-0.5 text-[9px] uppercase font-black rounded-md border mt-0.5
                                  ${user.role === 'superadmin' 
                                    ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                  {user.role}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <FaEnvelope className="text-gray-400" /> 
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP TABLE VIEW */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-[11px] uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="p-4 pl-6">Admin Profile</th>
                                <th className="p-4">Email Address</th>
                                <th className="p-4 pr-6 text-right">Access Level</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-violet-50/30 transition-colors">
                                    {/* Profile */}
                                    <td className="p-4 pl-6">
                                      <div className="flex items-center gap-3">
                                        <img 
                                            src={user.photoURL || `https://api.dicebear.com/9.x/initials/svg?seed=${user.username || "User"}`} 
                                            alt="avatar" 
                                            className="w-10 h-10 rounded-full bg-gray-100 object-cover border border-gray-200"
                                        />
                                        <span className="font-bold text-gray-700">{user.username || "Unknown"}</span>
                                      </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                            <FaEnvelope className="text-gray-300" /> {user.email}
                                        </div>
                                    </td>

                                    {/* Role */}
                                    <td className="p-4 pr-6 text-right">
                                        <span className={`inline-block px-3 py-1 text-[10px] uppercase font-extrabold rounded-lg border
                                            ${user.role === 'superadmin' 
                                              ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminUsers;
