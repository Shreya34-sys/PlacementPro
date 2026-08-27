import React, { useState } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Send, 
  ShieldCheck, 
  TrendingUp, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { 
  PlacementDrive, 
  MarketTrendSuggestion, 
  ProctoringEvent, 
  UserProfile, 
  RAGKnowledgeChunk 
} from '../types';
import { AppTabType } from './Header';
import { GeminiBacklight } from './GeminiBacklight';
import { motion } from 'motion/react';

interface CommandCenterProps {
  currentFaculty: UserProfile;
  drives: PlacementDrive[];
  marketSuggestions: MarketTrendSuggestion[];
  proctoringLogs: ProctoringEvent[];
  ragChunks: RAGKnowledgeChunk[];
  onApproveSuggestion?: (id: string) => void;
  onRejectSuggestion?: (id: string) => void;
  onNavigateTab: (tab: AppTabType) => void;
  onQuickIngest?: (text: string, company: string) => Promise<any>;
  isIngesting?: boolean;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  drives,
  marketSuggestions,
  proctoringLogs,
  ragChunks,
  onApproveSuggestion,
  onRejectSuggestion,
  onNavigateTab,
  onQuickIngest,
  isIngesting = false,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [targetCompany, setTargetCompany] = useState('Tata Consultancy Services (TCS)');
  const [quickSuccess, setQuickSuccess] = useState(false);

  const pendingSuggestions = marketSuggestions.filter(s => s.status === 'pending');
  const activeFlags = proctoringLogs.filter(l => l.status === 'flagged' || l.status === 'pending_review');

  const handleRunQuickIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    if (onQuickIngest) {
      await onQuickIngest(quickInput, targetCompany);
    }
    setQuickInput('');
    setQuickSuccess(true);
    setTimeout(() => setQuickSuccess(false), 4000);
  };

  const samplePrompts = [
    { label: "TCS 2026 Hiring Shift", company: "Tata Consultancy Services (TCS)", text: "TCS Digital 2026 hiring pattern has increased focus on Data Structures, low-latency algorithms, and struct alignment. Aptitude requires speed math with 25 questions in 40 minutes." },
    { label: "Persistent Systems Core CS", company: "Persistent Systems", text: "Persistent Systems technical round requires Core Computer Science depth: Operating Systems deadlock prevention, DBMS indexing, and computer network protocols." },
    { label: "Infosys DSE Syllabus", company: "Infosys Limited", text: "Infosys DSE campus screening: 2 hands-on coding rounds emphasizing dynamic programming memoization and graph traversals. Minimum CGPA 7.0, zero active backlogs." },
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner & System Status */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs relative overflow-hidden transition-colors duration-500"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Placement Season 2026-2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, Admin
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl font-normal">
              PlacementPro's AI Agents &amp; RAG Knowledge Engine are synchronizing live market trends, 
              orchestrating campus test drives, and analyzing student placement readiness for KIT CSBS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Batch Readiness</div>
              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                88.5% Benchmark
              </div>
            </div>

            <button
              id="cmd-view-drives-btn"
              onClick={() => onNavigateTab('drives')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              <span>Manage Campus Drives</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid with motion spring physics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Active Drives */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          id="kpi-active-drives"
          onClick={() => onNavigateTab('drives')}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-4 cursor-pointer transition-all duration-300 shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">Active Drives</span>
            <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{drives.filter(d => d.status === 'active').length}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {drives.reduce((acc, d) => acc + (d.registeredCount || 0), 0)} Registrations
          </div>
        </motion.div>

        {/* Card 2: AI Market Suggestions */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          id="kpi-market-trends"
          onClick={() => onNavigateTab('rag_market')}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-400 dark:hover:border-amber-500 rounded-2xl p-4 cursor-pointer transition-all duration-300 shadow-xs hover:shadow-md group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">Market Alerts</span>
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingSuggestions.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">Pending AI Approvals</div>
        </motion.div>

        {/* Card 3: Proctoring Flags */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          id="kpi-proctoring-flags"
          onClick={() => onNavigateTab('proctoring')}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-rose-400 dark:hover:border-rose-500 rounded-2xl p-4 cursor-pointer transition-all duration-300 shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">Proctoring Flags</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{activeFlags.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">Integrity Alerts</div>
        </motion.div>

        {/* Card 4: RAG Vector Chunks */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          id="kpi-rag-chunks"
          onClick={() => onNavigateTab('rag_market')}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-4 cursor-pointer transition-all duration-300 shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">RAG Chunks</span>
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{ragChunks.length}</div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">Vector Knowledge Base</div>
        </motion.div>

        {/* Card 5: Student Readiness */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          id="kpi-student-readiness"
          onClick={() => onNavigateTab('analytics')}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-2xl p-4 cursor-pointer transition-all duration-300 shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold">Avg Readiness</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">88.5%</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">KIT TY CSBS Batch</div>
        </motion.div>

      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AI Quick Ingestion (With Google Gemini Aura Backlight) & Active Drives (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick AI Ingestion Dropzone for Faculty wrapped in Google Gemini Backlight */}
          <GeminiBacklight showBadge badgeLabel="Google Gemini 2.0 Flash Ingestion AI">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <span>Faculty AI Ingestion Engine</span>
                      <span className="gemini-text-gradient font-black text-[10px] uppercase tracking-wider">Gemini Powered</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Paste unstructured syllabus notes or job postings — AI extracts questions &amp; RAG chunks.
                    </p>
                  </div>
                </div>
                
                <select
                  id="cmd-target-company-select"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  aria-label="Target Company for AI Ingestion"
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Tata Consultancy Services (TCS)">TCS (Digital / Ninja)</option>
                  <option value="Persistent Systems">Persistent Systems</option>
                  <option value="Infosys Limited">Infosys Limited</option>
                  <option value="Google India">Google India</option>
                  <option value="General Placement">General Campus Prep</option>
                </select>
              </div>

              <form onSubmit={handleRunQuickIngest} className="space-y-3">
                <textarea
                  id="cmd-quick-input-textarea"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Paste Job Description, Hiring Syllabus, or Exam Topics here (e.g. 'TCS 2026 has added 15% more questions on Data Structures and memory optimization...')"
                  className="w-full h-28 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 transition resize-none font-mono"
                />

                {/* Sample 1-Click Fillers */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Presets:</span>
                  {samplePrompts.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setQuickInput(p.text);
                        setTargetCompany(p.company);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer font-medium"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  {quickSuccess ? (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Data ingested &amp; vector chunks generated successfully!</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Auto-populates: MCQ Questions • Coding Specs • Eligibility Rules • RAG Store
                    </div>
                  )}

                  <button
                    id="cmd-run-ingestion-btn"
                    type="submit"
                    disabled={isIngesting || !quickInput.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    {isIngesting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Parsing with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Run AI Ingestion</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </GeminiBacklight>

          {/* Active Campus Drives Monitor */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Active Campus Placement Drives</h3>
              </div>
              <button
                onClick={() => onNavigateTab('drives')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <span>View All &amp; Create</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {drives.slice(0, 3).map((drive) => (
                <div 
                  key={drive.id}
                  className="p-3.5 bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-base font-bold shadow-xs">
                      {drive.companyName.includes('TCS') ? '🏢' : drive.companyName.includes('Persistent') ? '⚡' : '🌐'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{drive.companyName}</span>
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md">
                          {drive.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">{drive.roleTitle} • {drive.ctc}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Eligibility: Min CGPA {drive.eligibility.minCgpa} | {drive.eligibility.allowedBranches.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 border-slate-200 dark:border-slate-700 pt-2 sm:pt-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {drive.registeredCount} <span className="text-slate-500 dark:text-slate-400 font-normal text-[10px]">registered</span>
                    </div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                      {drive.roundsConfig.length} Evaluated Rounds
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Market AI Suggestions & Proctoring Stream (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Pending AI Market Suggestions Card */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors duration-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">AI Market Trend Alerts</h3>
              </div>
              <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                1-Click Approvals
              </span>
            </div>
            
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              AI agents periodically scan recruiter patterns and propose instant updates to syllabus, questions, or proctoring rules.
            </p>

            <div className="space-y-3">
              {marketSuggestions.length === 0 ? (
                <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No pending suggestions.</div>
              ) : (
                marketSuggestions.slice(0, 2).map((sug) => (
                  <div 
                    key={sug.id}
                    className={`p-3 rounded-xl border transition ${
                      sug.status === 'approved' 
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' 
                        : sug.status === 'rejected'
                        ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 opacity-60'
                        : 'bg-slate-50/90 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{sug.company}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {sug.confidence}% Confidence
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {sug.trendTitle}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {sug.detectedShift}
                    </div>

                    {sug.status === 'pending' ? (
                      <div className="flex items-center justify-end space-x-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                        {onRejectSuggestion && (
                          <button
                            onClick={() => onRejectSuggestion(sug.id)}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                        {onApproveSuggestion && (
                          <button
                            onClick={() => onApproveSuggestion(sug.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve &amp; Sync</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Status: {sug.status.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onNavigateTab('rag_market')}
              className="w-full mt-3 py-2 text-center text-xs font-bold text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl border border-blue-200 dark:border-blue-800 transition cursor-pointer"
            >
              Open Full Market Intelligence &amp; RAG Store →
            </button>
          </div>

          {/* Live AI Proctoring Log Snippet */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors duration-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Live Proctoring Supervisor</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>

            <div className="space-y-2.5">
              {proctoringLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{log.studentName}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                      log.severity === 'high' 
                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                        : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {log.violationType.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                    {log.details}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('proctoring')}
              className="w-full mt-3 py-2 text-center text-xs font-bold text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl border border-rose-200 dark:border-rose-800 transition cursor-pointer"
            >
              Monitor Live AI Proctoring Center →
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
