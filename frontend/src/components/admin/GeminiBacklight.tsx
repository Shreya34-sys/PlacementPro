import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface GeminiBacklightProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'vibrant' | 'pulse';
  badgeLabel?: string;
  showBadge?: boolean;
}

export const GeminiBacklight: React.FC<GeminiBacklightProps> = ({
  children,
  className = '',
  intensity = 'vibrant',
  badgeLabel = 'Gemini 2.0 AI Powered',
  showBadge = false,
}) => {
  return (
    <div className={`relative group ${className}`}>
      
      {/* Outer Floating Aurora Glow - Smooth Gemini Mesh */}
      <motion.div 
        className={`absolute -inset-1 rounded-3xl opacity-60 dark:opacity-80 transition duration-700 group-hover:duration-300 pointer-events-none ${
          intensity === 'pulse' 
            ? 'animate-gemini-breathe' 
            : intensity === 'subtle'
            ? 'opacity-30 dark:opacity-50 blur-lg'
            : 'animate-gemini-breathe blur-xl'
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.4) 0%, rgba(155, 114, 207, 0.35) 40%, rgba(0, 196, 255, 0.4) 75%, rgba(244, 63, 94, 0.25) 100%)',
          zIndex: 0,
        }}
      />

      {/* Subtle Rim Backlight */}
      <div 
        className="absolute -inset-0.5 rounded-2xl opacity-40 dark:opacity-60 blur-sm pointer-events-none transition group-hover:opacity-90"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(66,133,244,0.3) 0%, rgba(155,114,207,0.25) 50%, transparent 80%)',
          zIndex: 0,
        }}
      />

      {/* Floating AI Badge */}
      {showBadge && (
        <div className="absolute -top-3 right-6 z-20 flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-[10px] font-bold border border-blue-200 dark:border-blue-700/80 shadow-md backdrop-blur-md transition-colors duration-300">
          <Sparkles className="w-3 h-3 text-blue-600 dark:text-cyan-300 animate-pulse" />
          <span className="gemini-text-gradient font-extrabold">{badgeLabel}</span>
        </div>
      )}

      {/* Foreground Content Card */}
      <div className="relative z-10 h-full">
        {children}
      </div>

    </div>
  );
};
