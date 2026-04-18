import React from "react";
import { FaTrash, FaTriangleExclamation, FaXmark, FaCheck, FaFloppyDisk } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { selectTheme } from "../store/slices/uiSlice";

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
  const theme = useSelector(selectTheme);
  const darkMode = theme === 'dark';

  if (!isOpen) return null;

  const isDanger = type === "danger";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl scale-in-center border transition-colors duration-300 ${
        darkMode ? "bg-gray-900 border-gray-800 shadow-black/40" : "bg-white border-gray-50 shadow-xl"
      }`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              isDanger 
                ? (darkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-500") 
                : (darkMode ? "bg-violet-900/30 text-violet-400" : "bg-violet-100 text-violet-600")
            }`}>
              {isDanger ? <FaTrash className="text-xl" /> : <FaFloppyDisk className="text-xl" />}
            </div>
            <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
              {title || "Confirmation"}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full transition-colors ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <FaXmark className={`text-xl ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
          </button>
        </div>

        <div className={`mb-8 flex items-start gap-4 p-4 rounded-2xl border ${
          isDanger 
            ? (darkMode ? "bg-red-900/20 text-red-200 border-red-900/30" : "bg-red-50 text-red-800 border-red-100") 
            : (darkMode ? "bg-violet-900/20 text-violet-200 border-violet-900/30" : "bg-violet-50 text-violet-800 border-violet-100")
        }`}>
          {isDanger ? <FaTriangleExclamation className="text-red-500 text-xl flex-shrink-0 mt-1" /> : <FaCheck className="text-violet-500 text-xl flex-shrink-0 mt-1" />}
          <p className="text-sm font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className={`flex-1 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 ${
              darkMode 
                ? "text-gray-300 bg-gray-800 hover:bg-gray-700" 
                : "text-gray-600 bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-6 py-3 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 
              ${isDanger 
                ? `bg-red-500 hover:bg-red-600 ${darkMode ? "shadow-red-900/20" : "shadow-red-100"}` 
                : `bg-violet-600 hover:bg-violet-700 ${darkMode ? "shadow-violet-900/20" : "shadow-violet-100"}`
              }`}
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
