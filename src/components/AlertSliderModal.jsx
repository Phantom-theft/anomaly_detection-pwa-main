import React, { useEffect, useRef, useState } from 'react';
import { X, Video, Clock, ShieldAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * AlertSliderModal - Adapted from your Framer Motion design.
 * Isolated component to protect your existing page logic.
 */
const AlertSliderModal = ({ isOpen, onClose, activeAlert, alerts, darkMode }) => {
  const [selectedAlert, setSelectedAlert] = useState(activeAlert);
  const [constraints, setConstraints] = useState(0);
  const carousel = useRef(null);

  // Update selection when a new alert is clicked from the main list
  useEffect(() => {
    if (activeAlert) setSelectedAlert(activeAlert);
  }, [activeAlert]);

  // Handle vertical drag constraints
  useEffect(() => {
    if (isOpen && carousel.current) {
      const element = carousel.current;
      const viewportHeight = element.offsetHeight;
      const viewScrollHeight = element.scrollHeight;
      setConstraints(viewportHeight - viewScrollHeight);
    }
  }, [isOpen, selectedAlert]);

  // Escape key support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8 overflow-hidden"
      >
        {/* Immersive Backdrop */}
        <div 
          className={`absolute inset-0 backdrop-blur-2xl cursor-zoom-out ${
            darkMode ? "bg-black/90" : "bg-neutral-200/90"
          }`}
          onClick={onClose}
        />

        {/* Close Button */}
        <button
          className={`absolute top-6 right-6 p-3 rounded-2xl border transition-all z-[160] hover:scale-110 active:scale-95 shadow-xl ${
            darkMode ? "bg-gray-900/80 border-gray-700 text-white" : "bg-white/80 border-gray-200 text-gray-800"
          }`}
          onClick={onClose}
        >
          <X size={24} />
        </button>

        {/* Main Modal Layout */}
        <motion.div
          layoutId={`alert-container-${selectedAlert?.id}`}
          className="relative w-full max-w-6xl h-[85vh] flex flex-col md:flex-row gap-6 items-center justify-center z-[155]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Video & Details Panel */}
          <motion.div 
            className={`flex-1 w-full h-full rounded-[2.5rem] overflow-hidden border shadow-2xl flex flex-col ${
              darkMode ? "bg-gray-900/80 border-gray-800" : "bg-white/80 border-gray-100"
            }`}
          >
            {/* Immersive Video Player */}
            <div className="flex-1 bg-black relative flex items-center justify-center min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedAlert?.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {selectedAlert?.video ? (
                    <video 
                      src={selectedAlert.video} 
                      controls 
                      autoPlay 
                      className="max-w-full max-h-full object-contain"
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-600">
                      <Video size={64} className="animate-pulse opacity-20" />
                      <p className="text-xs font-black uppercase tracking-widest opacity-40">Video Processing...</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Info Section */}
            <div className={`p-8 flex flex-wrap items-center justify-between gap-6 border-t ${
              darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
            }`}>
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-3xl ${darkMode ? "bg-violet-900/40 text-violet-400" : "bg-violet-100 text-violet-600"}`}>
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <h3 className={`text-2xl font-black tracking-tight capitalize ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {selectedAlert?.action}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <Clock size={14} /> {selectedAlert?.formattedTime}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                  darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                }`}>
                  DEVICE: {selectedAlert?.camera_name}
                </div>
                <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                   darkMode ? "border-violet-500/30 text-violet-400" : "border-violet-200 text-violet-600"
                }`}>
                  CONFIDENCE: {selectedAlert?.accuracy ? Math.round(selectedAlert.accuracy * 100) + "%" : selectedAlert?.confidence}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Draggable Sidebar Carousel */}
          <div 
            className={`w-full md:w-40 h-32 md:h-full overflow-hidden rounded-[2.5rem] border ${
              darkMode ? "bg-gray-900/40 border-gray-800" : "bg-white/40 border-gray-100"
            }`}
            ref={carousel}
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: constraints, bottom: 0 }}
              className="flex flex-row md:flex-col gap-4 p-4 h-fit"
            >
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  className={`relative flex-shrink-0 w-28 md:w-full aspect-video rounded-2xl overflow-hidden cursor-pointer border-4 transition-all ${
                    selectedAlert?.id === alert.id 
                      ? "border-violet-500 scale-95 shadow-2xl" 
                      : "border-transparent opacity-40 hover:opacity-100"
                  }`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  {alert.video ? (
                    <video src={alert.video} className="w-full h-full object-cover pointer-events-none">
                      <track kind="captions" />
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-950">
                      <Video size={20} className="text-gray-800" />
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlertSliderModal;
