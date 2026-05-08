import React, { useEffect, useRef, useState } from 'react';
import { X, Video, Clock, ShieldAlert, Maximize2, Minimize2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * AlertSliderModal - Refined responsive scrolling (Vertical on Desktop, Horizontal on Mobile).
 */
const AlertSliderModal = ({ isOpen, onClose, activeAlert, alerts, darkMode }) => {
  const [selectedAlert, setSelectedAlert] = useState(activeAlert);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [constraints, setConstraints] = useState(0);
  const carousel = useRef(null);

  // Sync selection when a new alert is clicked from the main list
  useEffect(() => {
    if (activeAlert) setSelectedAlert(activeAlert);
  }, [activeAlert]);

  // Reactive window resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle drag constraints based on orientation
  useEffect(() => {
    if (isOpen && carousel.current) {
      const element = carousel.current;
      // Small delay to ensure layout has settled
      const timer = setTimeout(() => {
        if (isMobile) {
          const viewportWidth = element.offsetWidth;
          const viewScrollWidth = element.scrollWidth;
          setConstraints(viewportWidth - viewScrollWidth);
        } else {
          const viewportHeight = element.offsetHeight;
          const viewScrollHeight = element.scrollHeight;
          setConstraints(viewportHeight - viewScrollHeight);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedAlert, isTheaterMode, isMobile, alerts]);

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

  // On Mobile, we keep the playlist even in Theater Mode. On Desktop, we hide it for "Full" width.
  const showSidebar = !isTheaterMode || isMobile;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4 lg:p-6 overflow-hidden"
      >
        {/* Immersive Backdrop - Glassmorphism effect */}
        <div 
          className={`absolute inset-0 backdrop-blur-md cursor-zoom-out transition-all duration-700 ${
            darkMode ? "bg-black/30" : "bg-white/20"
          }`}
          onClick={onClose}
        />

        {/* Top Controls */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 md:gap-3 z-[165]">
          <button
            title={isTheaterMode ? "Exit Theater Mode" : "Theater Mode"}
            className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl border transition-all hover:scale-110 active:scale-95 shadow-xl backdrop-blur-xl ${
              darkMode ? "bg-gray-900/40 border-gray-700 text-white hover:bg-violet-600" : "bg-white/40 border-gray-200 text-gray-800 hover:bg-violet-100"
            }`}
            onClick={() => setIsTheaterMode(!isTheaterMode)}
          >
            {isTheaterMode ? <Minimize2 size={20} className="md:w-6 md:h-6" /> : <Maximize2 size={20} className="md:w-6 md:h-6" />}
          </button>
          <button
            title="Close"
            className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl border transition-all hover:scale-110 active:scale-95 shadow-xl backdrop-blur-xl ${
              darkMode ? "bg-gray-900/40 border-gray-700 text-white hover:bg-red-600" : "bg-white/40 border-gray-200 text-gray-800 hover:bg-red-100"
            }`}
            onClick={onClose}
          >
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        {/* Main Modal Layout */}
        <motion.div
          layout
          className={`relative w-full transition-all duration-500 ease-in-out flex flex-col md:flex-row gap-3 md:gap-6 items-center justify-center z-[155] ${
            isTheaterMode ? "max-w-full h-full md:h-[95vh] px-0 md:px-4" : "max-w-7xl h-full md:h-[88vh]"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Main Video & Details Panel */}
          <motion.div 
            layout
            className={`flex-1 w-full h-full md:rounded-[2.5rem] overflow-hidden border-x md:border shadow-2xl flex flex-col backdrop-blur-xl ${
              darkMode ? "bg-gray-900/40 border-gray-800" : "bg-white/40 border-gray-100"
            } ${isTheaterMode ? "md:border-violet-500/30 border-none" : ""}`}
          >
            {/* Immersive Video Player */}
            <div className="flex-1 bg-black/40 relative flex items-center justify-center min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedAlert?.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {selectedAlert?.video ? (
                    <video 
                      src={selectedAlert.video} 
                      controls 
                      autoPlay 
                      className="w-full h-full object-contain"
                    >
                      <track kind="captions" />
                    </video>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-600">
                      <Video size={48} className="md:w-16 md:h-16 animate-pulse opacity-20" />
                      <p className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-40">Video Processing...</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Info Section - Always hidden in Theater Mode */}
            {!isTheaterMode && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`p-4 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6 border-t ${
                  darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3 md:gap-5">
                  <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl ${darkMode ? "bg-violet-900/40 text-violet-400" : "bg-violet-100 text-violet-600"}`}>
                    <ShieldAlert size={20} className="md:w-7 md:h-7" />
                  </div>
                  <div>
                    <h3 className={`text-lg md:text-2xl font-black tracking-tight capitalize ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {selectedAlert?.action}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider">
                      <Clock size={12} className="md:w-3.5 md:h-3.5" /> {selectedAlert?.formattedTime}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className={`px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest ${
                    darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                  }`}>
                    DEVICE: {selectedAlert?.camera_name}
                  </div>
                  <div className={`px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${
                    darkMode ? "border-violet-500/30 text-violet-400" : "border-violet-200 text-violet-600"
                  }`}>
                    CONFIDENCE: {selectedAlert?.accuracy ? Math.round(selectedAlert.accuracy * 100) + "%" : selectedAlert?.confidence}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Playlist Carousel - Nested structure to contain scrollbar inside rounded corners */}
          {showSidebar && (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full md:w-48 h-28 md:h-full md:rounded-[2.5rem] border-y md:border overflow-hidden transition-all backdrop-blur-xl ${
                darkMode ? "bg-gray-900/40 border-gray-800" : "bg-white/40 border-gray-100"
              }`}
            >
              <div className={`w-full h-full custom-scrollbar ${isMobile ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto overflow-x-hidden"}`}>
                <div className="flex flex-row md:flex-col gap-3 md:gap-4 p-3 md:p-4 h-full md:h-fit min-w-full md:min-h-full">
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      whileHover={{ scale: 1.05 }}
                      className={`relative flex-shrink-0 w-32 md:w-full aspect-video rounded-xl md:rounded-2xl overflow-hidden cursor-pointer border-2 md:border-4 transition-all ${
                        selectedAlert?.id === alert.id 
                          ? "border-violet-500 scale-95 shadow-xl" 
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
                          <Video size={16} className="text-gray-800" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlertSliderModal;
