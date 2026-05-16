import React from 'react';

const SecurityLogo = () => {
  return (
    <div className="w-full h-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/20 blur-[120px] rounded-full animate-pulse"></div>
      
      {/* Tech Grid Pattern */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

      <div className="relative z-10 w-64 h-64 lg:w-96 lg:h-96">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">
          {/* Hexagonal Outer Frame */}
          <path 
            d="M100 15L173.6 57.5V142.5L100 185L26.4 142.5V57.5L100 15Z" 
            className="stroke-violet-500/30" 
            strokeWidth="1" 
            fill="none"
          />
          
          {/* Main Shield Body */}
          <path 
            d="M100 30L155 60V115C155 150 100 175 100 175C100 175 45 150 45 115V60L100 30Z" 
            className="fill-slate-900 stroke-violet-500" 
            strokeWidth="3"
          />

          {/* Inner Decorative Rings */}
          <circle cx="100" cy="90" r="35" className="stroke-violet-400/20" strokeWidth="0.5" fill="none" />
          <circle cx="100" cy="90" r="45" className="stroke-violet-400/10" strokeWidth="0.5" fill="none" />

          {/* Central Camera / Lens Element */}
          <g className="animate-pulse">
            <circle cx="100" cy="90" r="25" className="fill-violet-600/20 stroke-violet-400" strokeWidth="2" />
            <circle cx="100" cy="90" r="12" className="fill-violet-500 dark:fill-violet-400" />
            <circle cx="94" cy="84" r="3" fill="white" fillOpacity="0.6" />
          </g>

          {/* Scanning Line Animation */}
          <g>
            <rect x="50" y="60" width="100" height="2" fill="url(#scanLineGradient)">
              <animate 
                attributeName="y" 
                values="60;140;60" 
                dur="4s" 
                repeatCount="indefinite" 
              />
            </rect>
          </g>

          {/* Tech HUD Elements */}
          <path d="M40 40 L60 40 M40 40 L40 60" stroke="#8b5cf6" strokeWidth="2" className="opacity-50" />
          <path d="M160 40 L140 40 M160 40 L160 60" stroke="#8b5cf6" strokeWidth="2" className="opacity-50" />
          <path d="M40 160 L60 160 M40 160 L40 140" stroke="#8b5cf6" strokeWidth="2" className="opacity-50" />
          <path d="M160 160 L140 160 M160 160 L160 140" stroke="#8b5cf6" strokeWidth="2" className="opacity-50" />

          <defs>
            <linearGradient id="scanLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(139,92,246,0)" />
              <stop offset="50%" stopColor="rgba(139,92,246,0.8)" />
              <stop offset="100%" stopColor="rgba(139,92,246,0)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Decorative Text Labels */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <span className="text-[10px] font-mono tracking-[0.5em] text-violet-400 uppercase">System Active</span>
        <div className="flex gap-1">
            {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-1 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }}></div>)}
        </div>
      </div>
    </div>
  );
};

export default SecurityLogo;
