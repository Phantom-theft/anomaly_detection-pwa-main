import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { WifiOff, Loader2, Radio } from "lucide-react";

/**
 * HLSPlayer — Nagpe-play ng HLS stream mula sa Flask backend.
 *
 * Props:
 *   cameraName  — pangalan ng camera (e.g. "cam1")
 *   serverUrl   — base URL ng Flask server (e.g. "http://192.168.1.x:5000")
 *   className   — optional Tailwind classes
 */
const HLSPlayer = ({ cameraName, serverUrl = "http://localhost:5000", className = "" }) => {
  const videoRef  = useRef(null);
  const hlsRef    = useRef(null);

  const [status, setStatus]   = useState("connecting");
  // connecting | playing | error | retrying

  const hlsUrl = `${serverUrl}/hls/${cameraName}/stream.m3u8`;

  useEffect(() => {
    if (!cameraName) return;

    const initHLS = () => {
      // Linisin ang dati
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      setStatus("connecting");

      // ── Native HLS (Safari, iOS) ─────────────────────────
      if (!Hls.isSupported()) {
        if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
          videoRef.current.src = hlsUrl;
          videoRef.current.addEventListener("loadedmetadata", () => setStatus("playing"));
          videoRef.current.addEventListener("error", () => setStatus("error"));
        } else {
          setStatus("error");
        }
        return;
      }

      // ── hls.js (Chrome, Firefox, Edge) ──────────────────
      const hls = new Hls({
        liveSyncDurationCount:  3,    // 3 segments = ~6 seconds behind live
        liveMaxLatencyDurationCount: 6,
        maxBufferLength:        10,
        maxMaxBufferLength:     20,
        lowLatencyMode:         true,
      });

      hlsRef.current = hls;

      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus("playing");
        videoRef.current?.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setStatus("retrying");
          console.warn("[HLS] Fatal error — retrying in 5s...", data);
          setTimeout(() => initHLS(), 5000);   // Auto-retry
        }
      });
    };

    // Maghintay ng 3 seconds bago mag-connect —
    // para may time ang FFmpeg na mag-generate ng unang segment
    const timer = setTimeout(initHLS, 3000);

    return () => {
      clearTimeout(timer);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [cameraName, serverUrl, hlsUrl]);

  // ── Status Badge ─────────────────────────────────────────
  const StatusBadge = () => {
    const configs = {
      connecting: { icon: <Loader2 size={10} className="animate-spin" />, text: "Connecting...",  color: "bg-yellow-500" },
      playing:    { icon: <Radio    size={10} className="animate-pulse"/>, text: "LIVE",           color: "bg-green-500"  },
      retrying:   { icon: <Loader2  size={10} className="animate-spin" />, text: "Reconnecting...",color: "bg-orange-500" },
      error:      { icon: <WifiOff  size={10} />,                          text: "Unavailable",    color: "bg-red-500"    },
    };
    const cfg = configs[status] || configs.connecting;
    return (
      <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg text-white text-[10px] font-black uppercase tracking-widest ${cfg.color} backdrop-blur-sm shadow`}>
        {cfg.icon} {cfg.text}
      </div>
    );
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-black ${className}`}>

      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full aspect-video object-cover"
      />

      {/* Status Badge */}
      <StatusBadge />

      {/* Camera Label */}
      <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-widest backdrop-blur-sm">
        {cameraName} — HLS Remote
      </div>

      {/* Overlay kapag nag-connect pa lang */}
      {(status === "connecting" || status === "retrying") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white gap-3">
          <Loader2 size={36} className="animate-spin text-violet-400" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-300">
            {status === "connecting" ? "Starting HLS Stream..." : "Reconnecting..."}
          </p>
          <p className="text-[10px] text-gray-500">May 2-4 second delay (normal sa HLS)</p>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-3">
          <WifiOff size={36} className="text-red-400" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-300">Stream Unavailable</p>
          <p className="text-[10px] text-gray-500 text-center px-4">
            Check if FFmpeg is running.<br/>
            Try: <code className="text-violet-400">GET /hls/status</code>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-violet-600 rounded-xl text-xs font-bold hover:bg-violet-700 transition"
          >
            Retry
          </button>
        </div>
      )}

    </div>
  );
};

export default HLSPlayer;