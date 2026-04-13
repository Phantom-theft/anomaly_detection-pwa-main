import React from "react";
import { FaTrash, FaTriangleExclamation, FaXmark, FaCheck, FaFloppyDisk } from "react-icons/fa6";

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  loading = false,
  confirmText = "Confirm",
  type = "danger" // "danger" (red) or "primary" (violet)
}) => {
  if (!isOpen) return null;

  const isDanger = type === "danger";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl scale-in-center border border-gray-50">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isDanger ? "bg-red-100 text-red-500" : "bg-violet-100 text-violet-600"}`}>
              {isDanger ? <FaTrash className="text-xl" /> : <FaFloppyDisk className="text-xl" />}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{title || "Confirmation"}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FaXmark className="text-xl text-gray-400" />
          </button>
        </div>

        <div className={`mb-8 flex items-start gap-4 p-4 rounded-2xl border ${isDanger ? "bg-red-50 text-red-800 border-red-100" : "bg-violet-50 text-violet-800 border-violet-100"}`}>
          {isDanger ? <FaTriangleExclamation className="text-red-500 text-xl flex-shrink-0 mt-1" /> : <FaCheck className="text-violet-500 text-xl flex-shrink-0 mt-1" />}
          <p className="text-sm font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-6 py-3 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 
              ${isDanger ? "bg-red-500 hover:bg-red-600 shadow-red-100" : "bg-violet-600 hover:bg-violet-700 shadow-violet-100"}`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isDanger ? "Deleting..." : "Saving..."}
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
