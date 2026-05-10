import React, { useEffect, useRef, useState } from 'react';
import { X, Video, Clock, ShieldAlert, Maximize2, Minimize2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * PlaylistItem - Beautiful and Smooth
 * Uses GPU-accelerated transforms only for stability.
 */
const PlaylistItem = React.memo(({ alert, isSelected, onClick, darkMode }) => {
  const [isInView, setIsInView] = useState(false);
  const itemRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsInView(true); observer.disconnect(); }
    }, { rootMargin: '100px' });
    if (itemRef.current) observer.observe(itemRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={itemRef}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative flex-shrink-0 w-32 md:w-full aspect-video rounded-xl md:rounded-2xl overflow-hidden cursor-pointer transition-opacity duration-300 ${
        isSelected ? "opacity-100 ring-4 ring-violet-500 ring-inset" : "opacity-40 hover:opacity-100 ring-0"
      }`}
      style={{ 
        boxShadow: isSelected ? 'inset 0 0 0 4px #8b5cf6' : 'none',
        backgroundColor: darkMode ? '#020617' : '#f3f4f6'
      }}
      onClick={() => onClick(alert)}
    >
      {alert.video && isInView ? (
        <video src={alert.video} preload="metadata" muted className="w-full h-full object-cover pointer-events-none" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Video size={16} className={darkMode ? "text-gray-800" : "text-gray-300"} />
        </div>
      )}
    </motion.div>
  );
});
PlaylistItem.displayName = 'PlaylistItem';

const AlertSliderModal = ({ isOpen, onClose, activeAlert, alerts, darkMode }) => {
  const [selectedAlert, setSelectedAlert] = useState(activeAlert);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    if (activeAlert) setSelectedAlert(activeAlert);
  }, [activeAlert]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showSidebar = !isTheaterMode || isMobile;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4 lg:p-6 overflow-hidden"
        >
          {/* Immersive Glass Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`absolute inset-0 backdrop-blur-xl ${darkMode ? "bg-black/40" : "bg-white/10"}`}
            onClick={onClose}
          />

          {/* Glossy Top Controls */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 md:gap-3 z-[165]">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl border transition-colors shadow-xl backdrop-blur-2xl ${
                darkMode ? "bg-gray-900/40 border-gray-700 text-white hover:bg-violet-600" : "bg-white/60 border-gray-200 text-gray-800 hover:bg-violet-100"
              }`}
              onClick={() => setIsTheaterMode(!isTheaterMode)}
            >
              {isTheaterMode ? <Minimize2 size={20} className="md:w-6 md:h-6" /> : <Maximize2 size={20} className="md:w-6 md:h-6" />}
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl border transition-colors shadow-xl backdrop-blur-2xl ${
                darkMode ? "bg-gray-900/40 border-gray-700 text-white hover:bg-red-600" : "bg-white/60 border-gray-200 text-gray-800 hover:bg-red-100"
              }`}
              onClick={onClose}
            >
              <X size={20} className="md:w-6 md:h-6" />
            </motion.button>
          </div>

          {/* Main Container */}
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`relative w-full flex flex-col md:flex-row gap-3 md:gap-6 items-center justify-center z-[155] ${
              isTheaterMode ? "max-w-full h-full md:h-[95vh] px-0 md:px-4" : "max-w-7xl h-full md:h-[88vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Video & Details Panel */}
            <motion.div 
              layout
              className={`flex-1 w-full h-full md:rounded-[2.5rem] overflow-hidden border-x md:border shadow-2xl flex flex-col backdrop-blur-2xl transition-colors duration-300 ${
                darkMode ? "bg-gray-900/40 border-gray-800" : "bg-white/60 border-gray-100"
              } ${isTheaterMode ? "md:border-violet-500/30 border-none" : ""}`}
            >
              {/* Immersive Video Player */}
              <div className="flex-1 bg-black relative flex items-center justify-center min-h-0 overflow-hidden">
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
                      <video src={selectedAlert.video} controls autoPlay className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-gray-600">
                        <Video size={48} className="md:w-16 md:h-16 opacity-10 animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Stream Signal...</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Info Section */}
              {!isTheaterMode && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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

            {/* Playlist Sidebar */}
            {showSidebar && (
              <motion.div 
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`w-full md:w-48 h-28 md:h-full md:rounded-[2.5rem] border-y md:border overflow-hidden backdrop-blur-2xl transition-colors duration-300 ${
                  darkMode ? "bg-gray-900/40 border-gray-800" : "bg-white/60 border-gray-100"
                }`}
              >
                <div className={`w-full h-full ${isMobile ? "overflow-x-scroll overflow-y-hidden" : "overflow-y-scroll overflow-x-hidden"}`}>
                  <div className="flex flex-row md:flex-col gap-3 md:gap-4 p-3 md:p-4 h-full md:h-fit min-w-full md:min-h-full">
                    {alerts.map((alert) => (
                      <PlaylistItem
                        key={alert.id}
                        alert={alert}
                        isSelected={selectedAlert?.id === alert.id}
                        onClick={setSelectedAlert}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlertSliderModal;
