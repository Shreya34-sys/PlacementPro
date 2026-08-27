import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Briefcase, 
  BookOpen, 
  ShieldAlert, 
  Bot, 
  Users,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import { UserProfile } from '../../types/adminTypes';
import { mockFaculty } from '../../data/adminmockData';
import { GeminiAuraTheme } from './GeminiAuroraBackground';
import { motion } from 'motion/react';

export type AppTabType = 
  | 'command_center' 
  | 'rag_market' 
  | 'drives' 
  | 'exams' 
  | 'proctoring' 
  | 'interviews' 
  | 'analytics';

interface HeaderProps {
  activeTab: AppTabType;
  setActiveTab: (tab: AppTabType) => void;
  currentFaculty: UserProfile;
  allFaculty?: UserProfile[];
  onSelectFaculty: (faculty: UserProfile) => void;
  pendingMarketSuggestionsCount?: number;
  activeProctoringViolationsCount?: number;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  auraTheme?: GeminiAuraTheme;
  onSelectAuraTheme?: (theme: GeminiAuraTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentFaculty,
  pendingMarketSuggestionsCount = 0,
  activeProctoringViolationsCount = 0,
  isDarkMode = false,
  onToggleDarkMode,
  auraTheme = 'breathe_auto',
  onSelectAuraTheme,
}) => {
  const [showAuraMenu, setShowAuraMenu] = useState(false);

  const navItems: { id: AppTabType; label: string; icon: React.FC<{ className?: string }>; badge?: number; badgeColor?: string; isAiPowered?: boolean }[] = [
    { id: 'command_center', label: 'Command Center', icon: LayoutDashboard },
    { 
      id: 'rag_market', 
      label: 'RAG & Market AI', 
      icon: Sparkles, 
      badge: pendingMarketSuggestionsCount > 0 ? pendingMarketSuggestionsCount : undefined,
      badgeColor: 'bg-blue-600 dark:bg-blue-500',
      isAiPowered: true
    },
    { id: 'drives', label: 'Campus Drives', icon: Briefcase },
    { id: 'exams', label: 'Question Bank & Tests', icon: BookOpen, isAiPowered: true },
    { 
      id: 'proctoring', 
      label: 'AI Proctoring', 
      icon: ShieldAlert, 
      badge: activeProctoringViolationsCount > 0 ? activeProctoringViolationsCount : undefined,
      badgeColor: 'bg-rose-600',
      isAiPowered: true
    },
    { id: 'interviews', label: 'AI Interviews', icon: Bot, isAiPowered: true },
    { id: 'analytics', label: 'Student Readiness', icon: Users },
  ];

  const auraThemes: { id: GeminiAuraTheme; label: string; color: string; desc: string }[] = [
    { id: 'breathe_auto', label: 'Gemini Auto-Breathe', color: 'from-blue-500 via-purple-500 to-cyan-400', desc: 'Smoothly cycles ambient color waves every 6s' },
    { id: 'gemini_classic', label: 'Gemini Signature Flow', color: 'from-blue-500 via-indigo-400 to-cyan-400', desc: 'Classic Google AI light aura' },
    { id: 'cosmic_violet', label: 'Cosmic Violet Nebula', color: 'from-purple-600 via-pink-500 to-indigo-500', desc: 'Deep violet & magenta mood' },
    { id: 'oceanic_sapphire', label: 'Oceanic Emerald Flow', color: 'from-cyan-500 via-teal-400 to-emerald-500', desc: 'Cool aquatic sapphire waves' },
    { id: 'sunset_rose', label: 'Sunset Amber & Coral', color: 'from-rose-500 via-amber-400 to-pink-500', desc: 'Warm glowing sunrise gradient' },
  ];

  return (
    <header className="bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 sticky top-0 z-50 shadow-xs transition-colors duration-500">
      
      {/* Top Banner: Logo + Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-100 dark:border-slate-800/60">
          
          {/* Logo & Institution Branding */}
          <div 
            id="brand-logo-container"
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => setActiveTab('command_center')}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20 font-black text-xl text-white transition transform group-hover:scale-105">
              P
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
                  PlacementPro
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md">
                  Faculty Intelligence Hub
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                KIT's College of Engineering (Autonomous) • Dept. of CSBS
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2.5">
            
            {/* Gemini Dynamic Color Palette Switcher */}
            <div className="relative">
              <button
                id="gemini-aura-menu-btn"
                onClick={() => setShowAuraMenu(!showAuraMenu)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer shadow-2xs"
                title="Gemini Ambient Background Themes"
              >
                <Palette className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span className="hidden sm:inline">Gemini Aura</span>
                <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 animate-pulse" />
              </button>

              {/* Aura Themes Dropdown */}
              {showAuraMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 shadow-2xl z-50 space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Gemini Background Themes</span>
                    <Sparkles className="w-3 h-3 text-purple-500" />
                  </div>

                  <div className="space-y-1">
                    {auraThemes.map((t) => {
                      const isSelected = auraTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            if (onSelectAuraTheme) onSelectAuraTheme(t.id);
                            setShowAuraMenu(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl flex items-center space-x-2.5 transition cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-gradient-to-tr ${t.color} shrink-0 shadow-xs ring-1 ring-white/50`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs truncate">{t.label}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{t.desc}</div>
                          </div>
                          {isSelected && <span className="text-blue-600 dark:text-blue-400 text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Button: Market AI Alerts */}
            <button
              id="header-market-ai-btn"
              onClick={() => setActiveTab('rag_market')}
              className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                activeTab === 'rag_market'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
              title="Market Trends AI Ingestion Engine"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Market AI Alerts</span>
              {pendingMarketSuggestionsCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-xs">
                  {pendingMarketSuggestionsCount}
                </span>
              )}
            </button>

            {/* Dark/Light Mode Switch Toggle Button */}
            {onToggleDarkMode && (
              <button
                id="theme-toggle-btn"
                onClick={onToggleDarkMode}
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/90 text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                title={isDarkMode ? "Switch to Bright Light Mode" : "Switch to Smooth Dark Mode"}
                aria-label="Toggle dark and light mode"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400 transition-transform duration-500 rotate-0 hover:rotate-90" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 transition-transform duration-500 rotate-0 hover:-rotate-45" />
                )}
              </button>
            )}

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* Admin Badge */}
            <div className="flex items-center space-x-2.5 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                AD
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  Admin
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold leading-tight">
                  Placement Officer
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Horizontal Navigation Tabs with smooth active indicators */}
        <nav className="flex items-center space-x-1.5 overflow-x-auto py-2.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
                {item.isAiPowered && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/70" title="AI Enabled Feature" />
                )}
                {item.badge !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor || 'bg-blue-600'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
};
