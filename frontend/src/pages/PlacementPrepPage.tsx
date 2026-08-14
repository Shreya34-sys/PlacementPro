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
  List,
  BarChart3,
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
    headerGradient: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    progressColor: '#2563EB', // Blue
    difficultyBadgeClass: 'bg-black/20 text-white border border-white/10',
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
    headerGradient: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    progressColor: '#22C55E', // Green
    difficultyBadgeClass: 'bg-black/20 text-white border border-white/10',
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
    headerGradient: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    progressColor: '#A855F7', // Purple
    difficultyBadgeClass: 'bg-black/20 text-white border border-white/10',
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
    headerGradient: 'bg-gradient-to-r from-amber-600 to-orange-600',
    progressColor: '#F59E0B', // Orange
    difficultyBadgeClass: 'bg-black/20 text-white border border-white/10',
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
    headerGradient: 'bg-gradient-to-r from-pink-600 to-rose-600',
    progressColor: '#EC4899', // Pink
    difficultyBadgeClass: 'bg-black/20 text-white border border-white/10',
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
    headerGradient: 'bg-gradient-to-r from-violet-600 to-purple-600',
    progressColor: '#8B5CF6', // Violet
    difficultyBadgeClass: 'bg-black/20 text-white border border-white/10',
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
    headerGradient: 'bg-gradient-to-r from-indigo-600 to-slate-600',
    progressColor: '#6366F1', // Indigo
    difficultyBadgeClass: 'bg-black/20 text-white border border-white/10',
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
    headerGradient: 'bg-gradient-to-r from-teal-600 to-cyan-600',
    progressColor: '#14B8A6', // Teal
    difficultyBadgeClass: 'bg-black/20 text-white border border-white/10',
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
    headerGradient: 'bg-gradient-to-r from-cyan-600 to-blue-600',
    progressColor: '#06B6D4', // Cyan
    difficultyBadgeClass: 'bg-black/20 text-white border border-white/10',
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
    headerGradient: 'bg-gradient-to-r from-slate-600 to-gray-600',
    progressColor: '#64748B', // Slate
    difficultyBadgeClass: 'bg-black/20 text-white border border-white/10',
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
      className="min-h-screen bg-[#0E0E10] text-gray-100 pb-12 font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-[32px] leading-tight font-bold text-white tracking-tight">
                Placement Preparation Hub
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Sparkles className="w-3 h-3 text-blue-400" /> Premium Dashboard
              </span>
            </div>
            <p className="text-[14px] text-gray-400 font-normal">
              Master every placement round with structured learning paths.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('hub-search-input')?.focus()}
              className="w-10 h-10 rounded-full bg-[#1E293B] border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 flex items-center justify-center transition-all"
            >
              <Search className="w-4 h-4" />
            </motion.button>
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-[#1E293B] border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 flex items-center justify-center transition-all"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#0E0E10]"></span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="relative w-full md:w-[480px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="hub-search-input"
              type="text"
              placeholder="Search preparation modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-11 pr-10 text-[14px] bg-[#1E293B] text-white placeholder-gray-500 rounded-full border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {(['All', 'In Progress', 'Completed', 'Bookmarked'] as FilterTab[]).map((tab) => {
              const isActive = activeFilter === tab;
              return (
                <motion.button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-5 py-2.5 rounded-full text-[14px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1E293B] text-gray-400 hover:bg-[#2D3748]'
                  }`}
                >
                  {tab}
                </motion.button>
              );
            })}
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredModules.map((module) => {
            const IconComponent = module.icon;
            const isCompleted = module.progressPercent >= 100;
            return (
              <motion.div key={module.id} variants={cardVariants} className="h-full">
                <div className="group h-full overflow-hidden rounded-[14px] bg-[#1A1A1E] shadow-xl shadow-black/20 transition-all duration-250 hover:-translate-y-1">
                  <div className={`${module.iconBgColor} h-[58px] px-4 py-3 flex items-start justify-between`}>
                    <span className="max-w-[68%] truncate rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] leading-4 font-medium text-white">
                      {module.totalLessonsQuestions}
                    </span>
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] leading-4 font-semibold text-white">
                      {module.difficulty}
                    </span>
                  </div>

                  <div className="flex h-[calc(100%-58px)] flex-col p-5 pt-0">
                    <div className="flex items-start justify-between gap-3 -mt-[30px]">
                      <div className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[14px] ${module.iconBgColor} ring-4 ring-[#1A1A1E] shadow-lg shadow-black/25 transition-transform duration-250 group-hover:scale-105`}>
                        <IconComponent className="h-7 w-7 text-white" />
                      </div>
                      <button
                        onClick={(event) => toggleBookmark(module.id, event)}
                        title={module.isBookmarked ? 'Remove Bookmark' : 'Bookmark Module'}
                        className={`mt-9 rounded-lg p-1.5 transition-colors ${module.isBookmarked ? 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20' : 'text-gray-600 hover:bg-white/10 hover:text-gray-300'}`}
                      >
                        <Bookmark className="h-4 w-4 fill-current" />
                      </button>
                    </div>

                    <h2 className="mt-4 text-[20px] font-bold leading-snug text-white transition-colors group-hover:text-blue-300">
                      {module.title}
                    </h2>
                    <p className="mt-2 min-h-[63px] line-clamp-3 text-[14px] leading-[1.5] text-[#9CA3AF]">
                      {module.description}
                    </p>

                    <div className="mt-4 border-t border-white/10 pt-3.5 space-y-2.5">
                      <div className="flex items-center gap-2 text-[13px] text-gray-400">
                        <List className="h-4 w-4 text-gray-500" />
                        <span>{module.totalLessonsQuestions}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-gray-400">
                        <BarChart3 className="h-4 w-4 text-amber-400" />
                        <span className="text-amber-200/85">{module.difficulty} level</span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onNavigate?.(module.targetTab)}
                      className={`mt-5 flex h-[42px] w-full items-center justify-center gap-1.5 rounded-xl text-[14px] font-semibold transition-all duration-200 ${isCompleted ? 'border border-white/10 bg-white/10 text-gray-200 hover:bg-white/15' : 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700'}`}
                    >
                      {isCompleted ? <><CheckCircle2 className="h-4 w-4 text-emerald-400" /><span>Review Material</span></> : <><span>Continue Learning</span><ArrowRight className="h-4 w-4" /></>}
                    </motion.button>
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
            className="text-center py-16 bg-[#1A1A1E] rounded-[14px] border border-white/10 p-8 max-w-md mx-auto my-8 shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No preparation modules found</h3>
            <p className="text-sm text-gray-400 mb-6">
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
