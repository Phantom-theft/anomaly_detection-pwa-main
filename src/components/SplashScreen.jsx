import React from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectTheme } from '../store/slices/uiSlice';

const SplashScreen = ({ onFinish }) => {
  const theme = useSelector(selectTheme);
  const isDark = theme === 'dark';

  // The requested text in Title Case
  const text = "Anomaly Detection System";
  
  // Animation settings
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Faster stagger (was 0.08)
        delayChildren: 0.2,    // Shorter initial delay (was 0.3)
      },
    },
    exit: {
      opacity: 0,
      scale: 1.05,            // Subtler scale on exit
      filter: "blur(8px)",
      transition: { duration: 0.4, ease: "easeInOut" } // Faster exit (was 0.6)
    }
  };

  const letterVariants = {
    hidden: { 
      opacity: 0, 
      y: 15,                  // Subtler movement
      filter: "blur(5px)"
    },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)",
      transition: { 
        duration: 0.3,        // Faster letter animation (was 0.5)
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onAnimationComplete={(definition) => {
        if (definition === "visible") {
          // Reduced hold time after animation finishes (was 1500)
          setTimeout(onFinish, 800);
        }
      }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-colors duration-500 ${
        isDark ? "bg-[#030712]" : "bg-slate-50"
      }`}
    >
      <div className="flex flex-col items-center max-w-[90vw]">
        <div className="flex flex-wrap justify-center text-center">
          {text.split("").map((char, index) => (
            <motion.span
              key={index}
              variants={letterVariants}
              className={`text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter ${
                char === " " ? "w-4" : "text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600"
              }`}
              style={{ 
                WebkitBackgroundClip: 'text',
                display: "inline-block"
              }}
            >
              {char}
            </motion.span>
          ))}
        </div>
        
        {/* Animated accent line */}
        <motion.div 
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 2.2, duration: 1 }}
          className="h-[3px] w-48 bg-gradient-to-r from-transparent via-violet-600 to-transparent mt-8"
        />
      </div>

      {/* Ambient background pulse */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] blur-[120px] rounded-full animate-pulse ${
          isDark ? "bg-violet-600/15" : "bg-violet-600/10"
        }`}></div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
