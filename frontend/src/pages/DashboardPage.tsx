import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { CompanyLogo } from '../components/common/CompanyLogo';
import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Award,
  Clock,
  ArrowRight,
  Play,
  Bot,
  Code2,
  Brain,
  FileText,
  Mic,
  Building2,
  Target,
  Calendar,
  Zap,
  BookOpen,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string, jobId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const userName = currentUser?.name || 'Alex Johnson';

  const stats = [
    {
      id: 'stat-1',
      label: 'Readiness Score',
      value: '88%',
      change: '+4% this week',
      changePositive: true,
      icon: Award,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      id: 'stat-2',
      label: 'Modules Completed',
      value: '18 / 25',
      change: '72% completed',
      changePositive: true,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      id: 'stat-3',
      label: 'Problems Solved',
      value: '142',
      change: '12 solved this week',
      changePositive: true,
      icon: Target,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
    {
      id: 'stat-4',
      label: 'Mock Interviews',
      value: '12 Took',
      change: 'Avg Score: 92%',
      changePositive: true,
      icon: Bot,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
    },
  ];

  const quickActions = [
    {
      id: 'qa-1',
      title: 'AI Mock Interview',
      subtitle: 'Live voice & code assessment',
      icon: Bot,
      tab: 'ai-interview',
      color: 'bg-blue-600',
      lightBg: 'bg-blue-50/50 hover:bg-blue-50 border-blue-100/50',
    },
    {
      id: 'qa-2',
      title: 'LeetCode Arena',
      subtitle: 'Top 150 DS & Algo problems',
      icon: Code2,
      tab: 'leetcode-practice',
      color: 'bg-emerald-600',
      lightBg: 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100/50',
    },
    {
      id: 'qa-3',
      title: 'Aptitude Practice',
      subtitle: 'Quantitative & logical speed tests',
      icon: Brain,
      tab: 'aptitude-test',
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50/50 hover:bg-amber-50 border-amber-100/50',
    },
    {
      id: 'qa-4',
      title: 'Resume AI Analyzer',
      subtitle: 'ATS keyword & match score check',
      icon: FileText,
      tab: 'resume-analyzer',
      color: 'bg-indigo-600',
      lightBg: 'bg-indigo-50/50 hover:bg-indigo-50 border-indigo-100/50',
    },
    {
      id: 'qa-5',
      title: 'Versant Speech Test',
      subtitle: 'Fluency & voice evaluation',
      icon: Mic,
      tab: 'versant-prep',
      color: 'bg-purple-600',
      lightBg: 'bg-purple-50/50 hover:bg-purple-50 border-purple-100/50',
    },
    {
      id: 'qa-6',
      title: 'Company Question Bank',
      subtitle: 'Target Google, Amazon, TCS',
      icon: Building2,
      tab: 'company-prep',
      color: 'bg-teal-600',
      lightBg: 'bg-teal-50/50 hover:bg-teal-50 border-teal-100/50',
    },
  ];

  const recommendedCompanies = [
    {
      id: 'comp-1',
      name: 'Google',
      logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&auto=format&fit=crop&q=80',
      role: 'Software Development Engineer',
      ctc: '28 - 45 LPA',
      difficulty: 'Hard',
      matchScore: '96%',
      tags: ['C++', 'Python', 'DS & Algo', 'System Design'],
    },
    {
      id: 'comp-2',
      name: 'Amazon',
      logo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=100&auto=format&fit=crop&q=80',
      role: 'SDE-1 (AWS & Retail)',
      ctc: '22 - 32 LPA',
      difficulty: 'Hard',
      matchScore: '92%',
      tags: ['Java', 'Trees & Graphs', 'OOP', 'Leadership Principles'],
    },
    {
      id: 'comp-3',
      name: 'TCS Digital',
      logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=80',
      role: 'System Engineer Prime',
      ctc: '9 - 12 LPA',
      difficulty: 'Medium',
      matchScore: '98%',
      tags: ['Aptitude', 'SQL', 'Coding', 'Communication'],
    },
    {
      id: 'comp-4',
      name: 'Razorpay',
      logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&auto=format&fit=crop&q=80',
      role: 'Frontend / Backend Engineer',
      ctc: '18 - 26 LPA',
      difficulty: 'Medium-Hard',
      matchScore: '90%',
      tags: ['React', 'Node.js', 'System Architecture', 'DB Design'],
    },
  ];

  const upcomingInterviews = [
    {
      id: 'int-1',
      company: 'Amazon Mock Technical Interview',
      type: 'Data Structures & System Design',
      date: 'Today',
      time: '04:00 PM',
      duration: '45 mins',
      interviewer: 'AI Interviewer (Gemini Pro)',
      badgeClass: 'bg-amber-50 text-amber-600 border border-amber-200/60',
    },
    {
      id: 'int-2',
      company: 'TCS Digital Mock Test',
      type: 'Aptitude & Speed Coding Round',
      date: 'Tomorrow',
      time: '10:00 AM',
      duration: '90 mins',
      interviewer: 'Online Assessment Engine',
      badgeClass: 'bg-blue-50 text-blue-600 border border-blue-200/60',
    },
    {
      id: 'int-3',
      company: 'Versant Voice Assessment',
      type: 'Spoken English & Fluency',
      date: 'Aug 18, 2026',
      time: '02:30 PM',
      duration: '20 mins',
      interviewer: 'Automated Speech Evaluator',
      badgeClass: 'bg-purple-50 text-purple-600 border border-purple-200/60',
    },
  ];

  const aiRecommendations = [
    {
      id: 'ai-1',
      icon: '💡',
      category: 'Data Structures',
      title: 'Boost Dynamic Programming Speed',
      description: 'Your accuracy in DP problems is 62%. Practice 5 Memoization pattern questions to reach target threshold.',
      actionText: 'Practice DP',
      tab: 'leetcode-practice',
    },
    {
      id: 'ai-2',
      icon: '🗣️',
      category: 'Communication',
      title: 'Complete Versant Voice Practice',
      description: 'Amazon and TCS require strong English fluency. Take a 15-minute voice assessment to evaluate pronunciation and fluency.',
      actionText: 'Start Versant',
      tab: 'versant-prep',
    },
    {
      id: 'ai-3',
      icon: '📄',
      category: 'Resume Analyzer',
      title: 'Optimize Resume for ATS Screening',
      description: 'Your ATS match score for SDE roles is 84%. Add "Microservices Architecture" and "Redis Caching" keywords.',
      actionText: 'Analyze Resume',
      tab: 'resume-analyzer',
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen bg-[#F8FAFC] text-gray-900 pb-12 font-sans"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* =========================================================================
            HEADER METRICS & WELCOME HERO
           ========================================================================= */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 mb-8"
        >
          {/* Top Banner Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Welcome Banner (8 Columns) */}
            <motion.div variants={itemVariants} className="lg:col-span-8">
              <div className="h-full bg-gradient-to-br from-[#F8FAFC] to-blue-50/50 border border-[#E5E7EB] text-gray-900 rounded-[16px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-blue-600">
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-2 z-10">
                  <div>
                    <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                      <span className="px-3 py-1 rounded-full text-[12px] font-medium bg-blue-100/50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Student Placement Portal
                      </span>
                      <span className="text-[12px] text-gray-500 font-medium">CS & IT Engineering • Batch 2026</span>
                    </div>

                    <div className="flex items-center gap-4 mb-2">
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80" alt="Profile Avatar" className="w-12 h-12 rounded-full border border-gray-200 shadow-sm" />
                      <h1 className="text-[32px] font-bold text-gray-900 leading-tight tracking-tight">
                        Welcome back, {userName}
                      </h1>
                    </div>
                    <p className="text-[14px] text-gray-600 max-w-xl font-normal leading-relaxed mb-6 mt-2">
                      Your placement journey is on track. Focus today on <strong className="text-gray-900 font-semibold">Dynamic Programming</strong> and <strong className="text-gray-900 font-semibold">Mock Technical Interviews</strong> to reach your target CTC.
                    </p>
                  </div>
                  
                  {/* Circular Weekly Progress Indicator */}
                  <div className="hidden sm:flex flex-col items-center justify-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm shrink-0">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="175" strokeDashoffset="44" className="text-blue-600" />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-[14px] font-bold text-gray-900 leading-none">75%</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 mt-2 uppercase tracking-wide">Weekly Goal</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap pt-2 z-10">
                  <button
                    onClick={() => onNavigate('placement-prep')}
                    className="h-[44px] px-5 rounded-[12px] bg-blue-600 hover:opacity-90 text-white font-medium text-[14px] shadow-sm flex items-center gap-2 transition-all hover:shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current text-white" />
                    <span>Continue Learning Journey</span>
                  </button>
                  <button
                    onClick={() => onNavigate('ai-interview')}
                    className="h-[44px] px-5 rounded-[12px] bg-white hover:bg-gray-50 text-gray-700 font-medium text-[14px] border border-gray-200 shadow-sm flex items-center gap-2 transition-all hover:border-gray-300"
                  >
                    <Bot className="w-4 h-4 text-gray-500" />
                    <span>Launch AI Mock Interview</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Active Resume Lesson Card (4 Columns) */}
            <motion.div variants={itemVariants} className="lg:col-span-4">
              <div className="h-full bg-white rounded-[16px] border border-[#E5E7EB] p-6 shadow-sm flex flex-col justify-between transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-blue-600 group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Continue Learning
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-blue-50 text-blue-600 border border-blue-100/50">
                      Module 4 of 6
                    </span>
                  </div>

                  <h3 className="text-[18px] font-semibold text-gray-900 mb-1 leading-snug">
                    Data Structures & Algorithms
                  </h3>
                  <p className="text-[12px] text-gray-500 mb-4 font-medium">Graph Algorithms & Breadth-First Search (BFS)</p>

                  <div className="bg-[#F8FAFC] border border-[#E5E7EB] p-3.5 rounded-xl mb-4">
                    <div className="flex items-center justify-between text-[12px] font-semibold mb-1.5">
                      <span className="text-gray-700">Module Progress</span>
                      <span className="text-blue-600 font-bold">72%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200/80 rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '72%' }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-blue-600 rounded-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[12px] font-medium text-gray-500">
                      <span>18 / 25 Topics Completed</span>
                      <span>Est. 45 mins left</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('leetcode-practice')}
                  className="w-full h-[40px] rounded-[12px] bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 font-medium text-[14px] flex items-center justify-center gap-2 transition-colors border border-blue-100"
                >
                  <span>Resume Lesson</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Key Metrics Stats Grid (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <motion.div
                  key={stat.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className="group bg-white rounded-[16px] border border-[#E5E7EB] p-6 shadow-sm flex items-center justify-between transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-blue-600"
                >
                  <div>
                    <span className="text-[12px] font-medium text-gray-500 block mb-1">{stat.label}</span>
                    <span className="text-[22px] font-semibold text-gray-900 block leading-none mb-1.5">{stat.value}</span>
                    <span className="text-[12px] font-medium text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {stat.change}
                    </span>
                  </div>

                  <div className={`w-12 h-12 rounded-[12px] ${stat.bgColor} ${stat.color} flex items-center justify-center border ${stat.borderColor} group-hover:scale-110 transition-transform duration-250`}>
                    <StatIcon className="w-6 h-6 transition-transform duration-250 group-hover:scale-105" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* =========================================================================
            QUICK ACTIONS LAUNCHPAD (6 Cards)
           ========================================================================= */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[22px] font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Quick Actions Launchpad</span>
            </h2>
            <button
              onClick={() => onNavigate('placement-prep')}
              className="text-[14px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              View Full Syllabus <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((item) => {
              const ActionIcon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onNavigate(item.tab)}
                  className={`cursor-pointer bg-white border border-[#E5E7EB] rounded-[16px] p-6 shadow-sm flex items-center gap-4 group transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-blue-600`}
                >
                  <div className={`w-12 h-12 rounded-[12px] ${item.color} text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-250`}>
                    <ActionIcon className="w-5.5 h-5.5 transition-transform duration-250 group-hover:scale-105" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-[12px] font-medium text-gray-500 truncate">{item.subtitle}</p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            MAIN DASHBOARD CONTENT: Left 8 Cols (AI Recs + Target Companies) & Right 4 Cols
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* AI Recommendations Box */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 shadow-sm transition-all duration-250 ease-out hover:shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <h2 className="text-[22px] font-semibold text-gray-900">AI Recommendations for You</h2>
                </div>
                <span className="px-3 py-1 rounded-full text-[12px] font-medium bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Live Diagnostics
                </span>
              </div>

              <div className="space-y-4">
                {aiRecommendations.map((item) => (
                  <div key={item.id} className="p-5 bg-[#F8FAFC] rounded-[16px] border border-[#E5E7EB] hover:border-blue-200 transition-all hover:shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <span className="text-2xl p-2.5 bg-white rounded-xl border border-gray-200/80 shadow-sm shrink-0">{item.icon}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded-[6px] text-[12px] font-medium bg-gray-200/70 text-gray-700">{item.category}</span>
                            <h3 className="text-[14px] font-semibold text-gray-900">{item.title}</h3>
                          </div>
                          <p className="text-[14px] text-gray-600 leading-relaxed">{item.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigate(item.tab)}
                        className="self-end sm:self-center h-[40px] px-4 rounded-[12px] border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-900 font-medium text-[14px] transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                      >
                        <span>{item.actionText}</span>
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Target Companies Grid */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 shadow-sm transition-all duration-250 ease-out hover:shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-[22px] font-semibold text-gray-900 flex items-center gap-2 mb-1">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span>Recommended Target Companies</span>
                  </h2>
                  <p className="text-[14px] text-gray-500">Matching your skills, CGPA, and career goals.</p>
                </div>
                <button
                  onClick={() => onNavigate('companies')}
                  className="text-[14px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedCompanies.map((comp) => (
                  <motion.div 
                    key={comp.id} 
                    whileHover={{ scale: 1.02 }}
                    className="border border-[#E5E7EB] rounded-[16px] p-5 bg-white hover:-translate-y-1 transition-all duration-250 ease-out hover:shadow-lg hover:border-blue-600"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <CompanyLogo companyName={comp.name} logoUrl={comp.logo} size={48} />
                        <div>
                          <h3 className="text-[18px] font-semibold text-gray-900 leading-tight">{comp.name}</h3>
                          <p className="text-[12px] font-medium text-gray-500 mt-0.5">{comp.role}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {comp.matchScore} Match
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-[#F8FAFC] p-3 rounded-[12px] mb-4 border border-[#E5E7EB]">
                      <span className="text-[12px] font-medium text-gray-500">Target CTC: <strong className="text-gray-900 font-semibold">{comp.ctc}</strong></span>
                      <span className="text-[12px] font-medium text-gray-500">Difficulty: <strong className="text-amber-600 font-semibold">{comp.difficulty}</strong></span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {comp.tags.map((tag, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-[8px] text-[12px] font-medium bg-gray-100 text-gray-600 border border-gray-200/60">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => onNavigate('company-prep')}
                      className="w-full h-[40px] rounded-[12px] border border-blue-200 bg-blue-50/50 hover:bg-blue-600 hover:text-white text-blue-700 font-medium text-[14px] transition-colors"
                    >
                      Start {comp.name} Prep Kit
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Upcoming Interviews Widget */}
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 shadow-sm transition-all duration-250 ease-out hover:shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[22px] font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Upcoming Interviews</span>
                </h2>
                <span className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {upcomingInterviews.length} Scheduled
                </span>
              </div>

              <div className="space-y-4">
                {upcomingInterviews.map((item) => (
                  <motion.div 
                    key={item.id} 
                    whileHover={{ scale: 1.02 }}
                    className="p-5 bg-white rounded-[16px] border border-[#E5E7EB] hover:border-blue-300 transition-all duration-250 ease-out hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${item.badgeClass}`}>
                        {item.date} • {item.time}
                      </span>
                      <span className="text-[12px] font-medium text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {item.duration}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <CompanyLogo companyName={item.company} size={40} />
                      <div>
                        <h3 className="text-[14px] font-semibold text-gray-900 mb-0.5">{item.company}</h3>
                        <p className="text-[12px] font-medium text-gray-500 mb-0 truncate max-w-[200px]">{item.type}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-[12px] font-medium text-gray-500 flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-gray-400" /> {item.interviewer}
                      </span>
                      <button
                        onClick={() => onNavigate('ai-interview')}
                        className="h-[32px] px-3 rounded-[8px] bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-medium text-[12px] transition-all shadow-sm"
                      >
                        Join Room
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Placement Readiness Insight Box */}
            <div className="bg-gradient-to-br from-slate-900 to-gray-900 text-white rounded-[16px] p-6 shadow-lg border border-slate-800 transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center font-bold text-lg">
                  🎯
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-white leading-tight">Placement Tip of the Day</h3>
                  <p className="text-[12px] font-medium text-gray-400 mt-0.5">Based on 2026 Hiring Data</p>
                </div>
              </div>

              <p className="text-[14px] text-gray-300 leading-relaxed mb-6 font-medium">
                Top tech companies evaluate both problem-solving speed and clear articulation of system architecture. Take at least 2 AI mock interviews weekly to build confidence.
              </p>

              <button
                onClick={() => onNavigate('placement-prep')}
                className="w-full h-[40px] rounded-[12px] border border-white/20 bg-white/10 hover:bg-white/20 text-white font-medium text-[14px] transition-all"
              >
                Explore Placement Syllabus
              </button>
            </div>

          </div>

        </div>

      </div>
    </motion.div>
  );
};
