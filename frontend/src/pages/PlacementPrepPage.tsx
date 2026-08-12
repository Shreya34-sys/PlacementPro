import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  Building2,
  Brain,
  Code2,
  Laptop,
  Target,
  Mic,
  FileText,
  Users,
  Gamepad2,
  Bot,
  Search,
  Bell,
  X,
  ArrowRight,
  CheckCircle2,
  Bookmark,
  Sparkles,
} from 'lucide-react';

interface PlacementPrepPageProps {
  onNavigate?: (tab: string) => void;
}

export interface PrepModuleData {
  id: string;
  title: string;
  description: string;
  progressPercent: number;
  totalLessonsQuestions: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Hard' | 'All Levels' | 'Adaptive';
  status: 'In Progress' | 'Completed' | 'Not Started';
  isBookmarked?: boolean;
  targetTab: string;
  category: 'Company' | 'Technical' | 'Aptitude' | 'Coding' | 'LeetCode' | 'Versant' | 'Resume' | 'HR' | 'Gamified' | 'AI Planner';
  icon: React.ElementType;
  iconBgColor: string;
  iconTextColor: string;
  headerGradient: string;
  progressColor: string;
  difficultyBadgeClass: string;
}

const initialModules: PrepModuleData[] = [
  {
    id: 'company-prep',
    title: 'Company Preparation',
    description: 'Targeted guides and mock tests for top tech companies, hiring processes, and eligibility.',
    progressPercent: 65,
    totalLessonsQuestions: '45 Modules • 250+ Qs',
    difficulty: 'Intermediate',
    status: 'In Progress',
    isBookmarked: true,
    targetTab: 'company-prep',
    category: 'Company',
    icon: Building2,
    iconBgColor: 'bg-blue-500',
    iconTextColor: 'text-white',
    headerGradient: 'bg-gradient-to-r from-blue-900 to-indigo-900',
    progressColor: '#2563EB', // Blue
    difficultyBadgeClass: 'bg-blue-500/20 text-blue-200 border border-blue-400/30',
  },
  {
    id: 'aptitude-prep',
    title: 'Aptitude Preparation',
    description: 'Quantitative, logical, and verbal reasoning foundations with speed-solving shortcuts.',
    progressPercent: 80,
    totalLessonsQuestions: '32 Lessons • 500+ Qs',
    difficulty: 'Beginner',
    status: 'In Progress',
    isBookmarked: false,
    targetTab: 'aptitude-test',
    category: 'Aptitude',
    icon: Brain,
    iconBgColor: 'bg-emerald-500',
    iconTextColor: 'text-white',
    headerGradient: 'bg-gradient-to-r from-emerald-800 to-teal-900',
    progressColor: '#22C55E', // Green
    difficultyBadgeClass: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30',
  },
  {
    id: 'technical-prep',
    title: 'Technical Preparation',
    description: 'Advanced algorithms, data structures, DBMS, OS, Networks, and system design concepts.',
    progressPercent: 45,
    totalLessonsQuestions: '28 Modules • 180+ Qs',
    difficulty: 'Intermediate',
    status: 'In Progress',
    isBookmarked: true,
    targetTab: 'technical-prep',
    category: 'Technical',
    icon: Code2,
    iconBgColor: 'bg-purple-600',
    iconTextColor: 'text-white',
    headerGradient: 'bg-gradient-to-r from-purple-900 to-indigo-900',
    progressColor: '#A855F7', // Purple
    difficultyBadgeClass: 'bg-purple-500/20 text-purple-200 border border-purple-400/30',
  },
  {
    id: 'coding-prep',
    title: 'Coding Preparation',
    description: 'Core DSA Roadmap, Arrays, Strings, Trees, Graphs, Dynamic Programming & SQL Practice.',
    progressPercent: 70,
    totalLessonsQuestions: '60 Lessons • 300+ Qs',
    difficulty: 'Hard',
    status: 'In Progress',
    isBookmarked: false,
    targetTab: 'coding-round',
    category: 'Coding',
    icon: Laptop,
    iconBgColor: 'bg-amber-500',
    iconTextColor: 'text-white',
    headerGradient: 'bg-gradient-to-r from-amber-800 to-orange-900',
    progressColor: '#F59E0B', // Orange
    difficultyBadgeClass: 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
  },
  {
    id: 'leetcode-practice',
    title: 'LeetCode-style Practice',
    description: 'Daily Problem Challenge, Top Company Problems, Integrated IDE & AI Code Review.',
    progressPercent: 50,
    totalLessonsQuestions: '150 Problems • Live IDE',
    difficulty: 'Hard',
    status: 'In Progress',
    isBookmarked: true,
    targetTab: 'leetcode-practice',
    category: 'LeetCode',
    icon: Target,
    iconBgColor: 'bg-pink-600',
    iconTextColor: 'text-white',
    headerGradient: 'bg-gradient-to-r from-pink-900 to-rose-900',
    progressColor: '#EC4899', // Pink
    difficultyBadgeClass: 'bg-pink-500/20 text-pink-200 border border-pink-400/30',
  },
  {
    id: 'versant-prep',
    title: 'Versant Preparation',
    description: 'Reading Aloud, Sentence Repetition, Speaking Fluency, and AI Versant Mock Assessment.',
    progressPercent: 30,
    totalLessonsQuestions: '12 Tests • Speech AI',
    difficulty: 'Intermediate',
    status: 'In Progress',
    isBookmarked: false,
    targetTab: 'versant-prep',
    category: 'Versant',
    icon: Mic,
    iconBgColor: 'bg-violet-600',
    iconTextColor: 'text-white',
    headerGradient: 'bg-gradient-to-r from-violet-900 to-purple-900',
    progressColor: '#8B5CF6', // Violet
    difficultyBadgeClass: 'bg-violet-500/20 text-violet-200 border border-violet-400/30',
  },
  {
    id: 'resume-prep',
    title: 'Resume Preparation',
    description: 'ATS Resume Scoring, Industry Standard Resume Builder & Section Recommendations.',
    progressPercent: 100,
    totalLessonsQuestions: 'ATS Score • Builder',
    difficulty: 'Beginner',
    status: 'Completed',
    isBookmarked: false,
    targetTab: 'resume-analyzer',
    category: 'Resume',
    icon: FileText,
    iconBgColor: 'bg-indigo-600',
    iconTextColor: 'text-white',
    headerGradient: 'bg-gradient-to-r from-indigo-900 to-slate-900',
    progressColor: '#6366F1', // Indigo
    difficultyBadgeClass: 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30',
  },
  {
    id: 'hr-prep',
    title: 'HR Interview Preparation',
    description: 'Behavioral Questions, STAR Method Frameworks, Mock HR Sessions & instant AI Feedback.',
    progressPercent: 100,
    totalLessonsQuestions: '20 Modules • AI Feedback',
    difficulty: 'Beginner',
    status: 'Completed',
    isBookmarked: true,
    targetTab: 'hr-prep',
    category: 'HR',
    icon: Users,
    iconBgColor: 'bg-teal-600',
    iconTextColor: 'text-white',
    headerGradient: 'bg-gradient-to-r from-teal-900 to-cyan-950',
    progressColor: '#14B8A6', // Teal
    difficultyBadgeClass: 'bg-teal-500/20 text-teal-200 border border-teal-400/30',
  },
  {
    id: 'gamified-prep',
    title: 'Gamified Assessment',
    description: 'Cognitive Ability Challenges, Memory Tests, Spatial Reasoning & Speed Games.',
    progressPercent: 85,
    totalLessonsQuestions: '8 Mini-Games • Cognitive',
    difficulty: 'All Levels',
    status: 'In Progress',
    isBookmarked: false,
    targetTab: 'gamified-prep',
    category: 'Gamified',
    icon: Gamepad2,
    iconBgColor: 'bg-cyan-600',
    iconTextColor: 'text-white',
    headerGradient: 'bg-gradient-to-r from-cyan-900 to-blue-950',
    progressColor: '#06B6D4', // Cyan
    difficultyBadgeClass: 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30',
  },
  {
    id: 'study-planner',
    title: 'AI Study Planner',
    description: 'Personalized Daily Learning Goals, Weakness Diagnostics & Custom Study Schedules.',
    progressPercent: 60,
    totalLessonsQuestions: 'Daily Roadmap • AI Goals',
    difficulty: 'Adaptive',
    status: 'In Progress',
    isBookmarked: true,
    targetTab: 'study-planner',
    category: 'AI Planner',
    icon: Bot,
    iconBgColor: 'bg-slate-700',
    iconTextColor: 'text-white',
    headerGradient: 'bg-gradient-to-r from-slate-900 to-gray-900',
    progressColor: '#64748B', // Slate
    difficultyBadgeClass: 'bg-slate-500/20 text-slate-200 border border-slate-400/30',
  },
];

type FilterTab = 'All' | 'In Progress' | 'Completed' | 'Bookmarked';

export const PlacementPrepPage: React.FC<PlacementPrepPageProps> = ({ onNavigate }) => {
  const [modules, setModules] = useState<PrepModuleData[]>(initialModules);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModules((prev) =>
      prev.map((mod) => (mod.id === id ? { ...mod, isBookmarked: !mod.isBookmarked } : mod))
    );
  };

  const filteredModules = modules.filter((mod) => {
    const matchesSearch =
      mod.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.description.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (activeFilter === 'In Progress') matchesFilter = mod.status === 'In Progress';
    if (activeFilter === 'Completed') matchesFilter = mod.status === 'Completed';
    if (activeFilter === 'Bookmarked') matchesFilter = !!mod.isBookmarked;

    return matchesSearch && matchesFilter;
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-12 font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* =========================================================================
            TOP SECTION: Large Heading, Subtitle & Right Action Controls (Slide Down)
           ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-[32px] leading-tight font-bold text-gray-900 tracking-tight">
                Placement Preparation Hub
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                <Sparkles className="w-3 h-3 text-blue-500" /> Premium Dashboard
              </span>
            </div>
            <p className="text-[14px] text-gray-500 font-normal">
              Master every placement round with structured learning paths.
            </p>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3 align-self-start md:align-self-auto">
            {/* Search Icon Trigger / Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Quick Search"
              onClick={() => {
                const el = document.getElementById('hub-search-input');
                el?.focus();
              }}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200 flex items-center justify-center transition-all shadow-sm"
              title="Search Preparation Modules"
            >
              <Search className="w-4 h-4" />
            </motion.button>

            {/* Notification Icon */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Notifications"
                className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200 flex items-center justify-center transition-all shadow-sm"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
              </motion.button>
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm ring-2 ring-white cursor-pointer hover:opacity-95 transition-opacity">
                  SP
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* =========================================================================
            SEARCH & FILTER SECTION
           ========================================================================= */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Large Search Bar (Height 48px, Rounded Full, Focus Scale) */}
          <div className="relative w-full md:w-[420px] lg:w-[480px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="hub-search-input"
              type="text"
              placeholder="Search preparation modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-expand w-full h-12 pl-11 pr-10 text-[14px] bg-white text-gray-900 placeholder-gray-400 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {(['All', 'In Progress', 'Completed', 'Bookmarked'] as FilterTab[]).map((tab) => {
              const isActive = activeFilter === tab;
              return (
                <motion.button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`px-5 py-2.5 rounded-full text-[14px] font-medium transition-all duration-250 whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-600'
                      : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tab === 'Bookmarked' && <Bookmark className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />}
                  {tab}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            MODULES GRID (3 Columns, 24px Gap, Equal Height Cards)
           ========================================================================= */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredModules.map((module) => {
            const IconComponent = module.icon;
            const isCompleted = module.status === 'Completed';

            return (
              <motion.div key={module.id} variants={cardVariants} className="h-full">
                <div className="group bg-white rounded-[16px] border border-gray-200/90 soft-shadow hover-lift overflow-hidden h-full flex flex-col justify-between transition-all duration-250">
                  
                  {/* Card Top Header Banner */}
                  <div className={`${module.headerGradient} px-5 py-3 flex items-center justify-between`}>
                    {/* Left Pill Badge */}
                    <span className="text-[12px] font-medium text-white/90 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                      {module.totalLessonsQuestions}
                    </span>

                    {/* Right Difficulty Badge */}
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${module.difficultyBadgeClass}`}>
                      {module.difficulty}
                    </span>
                  </div>

                  {/* Card Body Content (Padding 20px) */}
                  <div className="p-[20px] flex-1 flex flex-col justify-between">
                    
                    <div>
                      {/* Top Row: Icon (48x48) + Bookmark Toggle */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div
                          className={`w-[48px] h-[48px] min-w-[48px] rounded-[12px] ${module.iconBgColor} ${module.iconTextColor} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-250`}
                        >
                          <IconComponent className="w-6 h-6 transition-transform duration-250 group-hover:scale-105" />
                        </div>

                        <button
                          onClick={(e) => toggleBookmark(module.id, e)}
                          title={module.isBookmarked ? 'Remove Bookmark' : 'Bookmark Module'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            module.isBookmarked
                              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                              : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                      {/* Middle: Module Title + Description */}
                      <h2 className="text-[18px] font-semibold text-gray-900 leading-snug mb-1.5 group-hover:text-blue-600 transition-colors">
                        {module.title}
                      </h2>
                      <p className="text-[14px] text-gray-500 font-normal leading-relaxed line-clamp-2 mb-5">
                        {module.description}
                      </p>
                    </div>

                    {/* Bottom Content Area: Progress Section + Button */}
                    <div className="mt-auto">
                      {/* Progress Section */}
                      <div className="bg-[#F8FAFC] border border-gray-100 p-3 rounded-[12px] mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] font-medium text-gray-600">Progress</span>
                          <span
                            className={`text-[12px] font-semibold ${
                              isCompleted ? 'text-emerald-600' : 'text-blue-600'
                            }`}
                          >
                            {module.progressPercent}%
                          </span>
                        </div>
                        {/* 6px Height Animated Progress Bar */}
                        <div className="w-full h-[6px] bg-gray-200/80 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${module.progressPercent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: module.progressColor }}
                          />
                        </div>
                      </div>

                      {/* Primary Action Button (Full Width, Height 42px, Rounded XL) */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onNavigate && onNavigate(module.targetTab)}
                        className={`w-full h-[42px] rounded-xl text-[14px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                          isCompleted
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                            : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Review Material</span>
                          </>
                        ) : (
                          <>
                            <span>Continue Learning</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </motion.button>
                    </div>

                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Empty State */}
        {filteredModules.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white rounded-[16px] border border-gray-200 p-8 max-w-md mx-auto my-8 shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No preparation modules found</h3>
            <p className="text-sm text-gray-500 mb-6">
              We couldn't find any modules matching "{searchTerm}" under "{activeFilter}".
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveFilter('All');
              }}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-sm rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};
