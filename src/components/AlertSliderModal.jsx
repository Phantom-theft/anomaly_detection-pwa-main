import React, { useEffect, useRef, useState } from 'react';
import { X, Video, Clock, ShieldAlert, Maximize2, Minimize2 } from 'lucide-react';

/**
 * PlaylistItem - Skeleton Version (No transitions, no shadows)
 */
const PlaylistItem = React.memo(({ alert, isSelected, onClick, darkMode }) => {
  const [isInView, setIsInView] = useState(false);
  const itemRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsInView(true); observer.disconnect(); }
    }, { rootMargin: '50px' });
    if (itemRef.current) observer.observe(itemRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={itemRef}
      className={`relative flex-shrink-0 w-32 md:w-full aspect-video rounded-xl overflow-hidden cursor-pointer ${
        isSelected ? "opacity-100 bg-violet-500" : "opacity-40"
      }`}
      onClick={() => onClick(alert)}
    >
      {alert.video && isInView ? (
        <video src={alert.video} preload="metadata" muted className="w-full h-full object-cover pointer-events-none" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <Video size={16} className="text-white/20" />
        </div>
      )}
    </div>
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

  if (!isOpen) return null;

  const showSidebar = !isTheaterMode || isMobile;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80">
      <div className="absolute top-4 right-4 z-[165] flex gap-2">
        <button className="p-3 rounded-xl bg-white/10 text-white" onClick={() => setIsTheaterMode(!isTheaterMode)}><Maximize2 size={20} /></button>
        <button className="p-3 rounded-xl bg-red-500 text-white" onClick={onClose}><X size={20} /></button>
      </div>

      <div className={`relative w-full h-full flex flex-col md:flex-row gap-4 p-4 ${isTheaterMode ? "max-w-full" : "max-w-7xl"}`}>
        <div className="flex-1 bg-black rounded-3xl overflow-hidden flex flex-col border border-white/10">
          <div className="flex-1 relative flex items-center justify-center">
            {selectedAlert?.video ? (
              <video src={selectedAlert.video} controls autoPlay className="w-full h-full object-contain" />
            ) : (
              <div className="text-white/20">Loading...</div>
            )}
          </div>

          {!isTheaterMode && (
            <div className="p-6 bg-gray-900 border-t border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <ShieldAlert size={24} className="text-violet-500" />
                <div>
                  <h3 className="text-white font-bold text-xl">{selectedAlert?.action}</h3>
                  <p className="text-gray-400 text-xs uppercase">{selectedAlert?.formattedTime}</p>
                </div>
              </div>
              <div className="text-violet-400 font-mono text-sm">{selectedAlert?.camera_name}</div>
            </div>
          )}
        </div>

        {showSidebar && (
          <div className="w-full md:w-48 h-32 md:h-full bg-gray-900 rounded-3xl overflow-hidden border border-white/10">
            <div className={`w-full h-full ${isMobile ? "overflow-x-scroll" : "overflow-y-scroll"}`}>
              <div className="flex flex-row md:flex-col gap-2 p-2">
                {alerts.map((alert) => (
                  <PlaylistItem key={alert.id} alert={alert} isSelected={selectedAlert?.id === alert.id} onClick={setSelectedAlert} darkMode={darkMode} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertSliderModal;
