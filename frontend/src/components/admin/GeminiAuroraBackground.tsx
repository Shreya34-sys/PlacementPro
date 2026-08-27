import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export type GeminiAuraTheme = 'gemini_classic' | 'cosmic_violet' | 'oceanic_sapphire' | 'sunset_rose' | 'breathe_auto';

interface GeminiAuroraBackgroundProps {
  theme?: GeminiAuraTheme;
  isDarkMode?: boolean;
}

export const GeminiAuroraBackground: React.FC<GeminiAuroraBackgroundProps> = ({
  theme = 'breathe_auto',
  isDarkMode = false,
}) => {
  const [activeCycleIndex, setActiveCycleIndex] = useState(0);

  // Auto breathe cycle for dynamic smooth color shifting
  useEffect(() => {
    if (theme !== 'breathe_auto') return;
    const interval = setInterval(() => {
      setActiveCycleIndex((prev) => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(interval);
  }, [theme]);

  // Color schemes defined as smooth radial gradients
  const themePresets = [
    // 0: Classic Gemini (Blue + Amethyst + Cyan + Coral)
    {
      c1: isDarkMode ? 'rgba(66, 133, 244, 0.28)' : 'rgba(66, 133, 244, 0.16)',
      c2: isDarkMode ? 'rgba(155, 114, 207, 0.26)' : 'rgba(155, 114, 207, 0.14)',
      c3: isDarkMode ? 'rgba(0, 196, 255, 0.24)' : 'rgba(0, 196, 255, 0.12)',
      c4: isDarkMode ? 'rgba(255, 99, 125, 0.18)' : 'rgba(255, 99, 125, 0.10)',
    },
    // 1: Cosmic Violet
    {
      c1: isDarkMode ? 'rgba(147, 51, 234, 0.28)' : 'rgba(147, 51, 234, 0.14)',
      c2: isDarkMode ? 'rgba(79, 70, 229, 0.26)' : 'rgba(79, 70, 229, 0.12)',
      c3: isDarkMode ? 'rgba(236, 72, 153, 0.22)' : 'rgba(236, 72, 153, 0.10)',
      c4: isDarkMode ? 'rgba(59, 130, 246, 0.20)' : 'rgba(59, 130, 246, 0.10)',
    },
    // 2: Oceanic Sapphire
    {
      c1: isDarkMode ? 'rgba(14, 165, 233, 0.28)' : 'rgba(14, 165, 233, 0.15)',
      c2: isDarkMode ? 'rgba(16, 185, 129, 0.24)' : 'rgba(16, 185, 129, 0.12)',
      c3: isDarkMode ? 'rgba(37, 99, 235, 0.25)' : 'rgba(37, 99, 235, 0.14)',
      c4: isDarkMode ? 'rgba(6, 182, 212, 0.22)' : 'rgba(6, 182, 212, 0.10)',
    },
    // 3: Sunset Rose
    {
      c1: isDarkMode ? 'rgba(244, 63, 94, 0.24)' : 'rgba(244, 63, 94, 0.13)',
      c2: isDarkMode ? 'rgba(249, 115, 22, 0.22)' : 'rgba(249, 115, 22, 0.11)',
      c3: isDarkMode ? 'rgba(168, 85, 247, 0.22)' : 'rgba(168, 85, 247, 0.12)',
      c4: isDarkMode ? 'rgba(234, 179, 8, 0.18)' : 'rgba(234, 179, 8, 0.08)',
    },
  ];

  let currentPresetIndex = activeCycleIndex;
  if (theme === 'gemini_classic') currentPresetIndex = 0;
  if (theme === 'cosmic_violet') currentPresetIndex = 1;
  if (theme === 'oceanic_sapphire') currentPresetIndex = 2;
  if (theme === 'sunset_rose') currentPresetIndex = 3;

  const currentTheme = themePresets[currentPresetIndex];

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden transition-colors duration-1000"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Background base coat */}
      <div 
        className={`absolute inset-0 transition-colors duration-700 ${
          isDarkMode ? 'bg-[#080d1a]' : 'bg-[#f8fafc]'
        }`} 
      />

      {/* Floating Aurora Orb 1: Top Left / Center */}
      <motion.div
        className="absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[100px] pointer-events-none"
        animate={{
          x: [0, 60, -40, 0],
          y: [0, 40, 80, 0],
          scale: [1, 1.15, 0.95, 1],
          backgroundColor: currentTheme.c1,
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating Aurora Orb 2: Top Right */}
      <motion.div
        className="absolute -top-[15%] right-[-5%] w-[50vw] h-[50vw] rounded-full blur-[110px] pointer-events-none"
        animate={{
          x: [0, -70, 30, 0],
          y: [0, 70, -20, 0],
          scale: [1, 0.9, 1.12, 1],
          backgroundColor: currentTheme.c2,
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating Aurora Orb 3: Bottom Center / Left */}
      <motion.div
        className="absolute top-[45%] -left-[15%] w-[60vw] h-[60vw] rounded-full blur-[120px] pointer-events-none"
        animate={{
          x: [0, 80, -30, 0],
          y: [0, -60, 50, 0],
          scale: [0.95, 1.18, 1, 0.95],
          backgroundColor: currentTheme.c3,
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating Aurora Orb 4: Bottom Right */}
      <motion.div
        className="absolute bottom-[-10%] right-[5%] w-[45vw] h-[45vw] rounded-full blur-[100px] pointer-events-none"
        animate={{
          x: [0, -50, 40, 0],
          y: [0, -70, 30, 0],
          scale: [1, 1.1, 0.92, 1],
          backgroundColor: currentTheme.c4,
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Subtle fine mesh grid texture overlay */}
      <div 
        className={`absolute inset-0 opacity-[0.035] dark:opacity-[0.05] pointer-events-none ${
          isDarkMode ? 'invert' : ''
        }`}
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};
