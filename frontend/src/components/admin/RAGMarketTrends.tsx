import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  Upload, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  BookOpen, 
  Layers, 
  Loader2, 
  Database, 
  Info, 
  Check, 
  TrendingUp, 
  Tag
} from 'lucide-react';
import { 
  RAGKnowledgeChunk, 
  MarketTrendSuggestion, 
  Company, 
  UserProfile 
} from '../types';
import { GeminiBacklight } from './GeminiBacklight';
import { motion } from 'motion/react';

interface RAGMarketTrendsProps {
  ragChunks: RAGKnowledgeChunk[];
  marketSuggestions: MarketTrendSuggestion[];
  companies: Company[];
  currentFaculty: UserProfile;
  onApproveSuggestion: (id: string) => void;
  onRejectSuggestion: (id: string) => void;
  onAddRAGChunk: (chunk: RAGKnowledgeChunk) => void;
  onRunMarketScan: () => Promise<void>;
  isScanning: boolean;
  onIngestData: (rawText: string, inputType: string, targetCompany: string) => Promise<any>;
}

export const RAGMarketTrends: React.FC<RAGMarketTrendsProps> = ({
  ragChunks,
  marketSuggestions,
  companies,
  currentFaculty,
  onApproveSuggestion,
  onRejectSuggestion,
  onAddRAGChunk,
  onRunMarketScan,
  isScanning,
  onIngestData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ingestion' | 'suggestions' | 'chunks' | 'format_guide'>('ingestion');
  const [ingestType, setIngestType] = useState<'jd' | 'syllabus' | 'interview_notes' | 'market_update'>('jd');
  const [targetCompany, setTargetCompany] = useState('Tata Consultancy Services (TCS)');
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    setIsProcessing(true);
    try {
      const res = await onIngestData(rawText, ingestType, targetCompany);
      if (res && res.data) {
        setParsedResult(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitParsedData = () => {
    if (!parsedResult) return;

    if (parsedResult.ragChunks && Array.isArray(parsedResult.ragChunks)) {
      parsedResult.ragChunks.forEach((chunk: any, i: number) => {
        const newChunk: RAGKnowledgeChunk = {
          id: `rag_${Date.now()}_${i}`,
          companyName: targetCompany,
          category: chunk.category || 'market_trends',
          sourceDocument: `Faculty Ingestion (${ingestType.toUpperCase()})`,
          rawText: chunk.content || rawText.slice(0, 300),
          tags: chunk.tags || ['ai_parsed', targetCompany.toLowerCase().replace(/\s+/g, '_')],
          vectorEmbeddingId: `emb_${Date.now()}_${i}`,
          ingestedAt: new Date().toISOString(),
          ingestedByFaculty: currentFaculty.name,
          aiSummarizedTakeaway: parsedResult.summary || 'Extracted via PlacementPro AI Agent.',
          relevanceScore: 0.95,
        };
        onAddRAGChunk(newChunk);
      });
    }

    setParsedResult(null);
    setRawText('');
    setActiveSubTab('chunks');
  };

  const filteredChunks = ragChunks.filter(c => {
    const matchesSearch = c.rawText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* Sub navigation bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl shadow-xs transition-colors duration-500">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>RAG Knowledge &amp; Market Intelligence Agent</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            Automate placement syllabus updating, vector retrieval knowledge base, and 1-click market trend synchronization.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto">
          <button
            id="rag-subtab-ingestion"
            onClick={() => setActiveSubTab('ingestion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeSubTab === 'ingestion' 
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Easy Faculty Ingestion
          </button>
          <button
            id="rag-subtab-suggestions"
            onClick={() => setActiveSubTab('suggestions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer relative ${
              activeSubTab === 'suggestions' 
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Market Trend Alerts
            {marketSuggestions.filter(s => s.status === 'pending').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-rose-600 text-white rounded-full font-bold">
                {marketSuggestions.filter(s => s.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            id="rag-subtab-chunks"
            onClick={() => setActiveSubTab('chunks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeSubTab === 'chunks' 
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            RAG Vector Chunks ({ragChunks.length})
          </button>
          <button
            id="rag-subtab-guide"
            onClick={() => setActiveSubTab('format_guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeSubTab === 'format_guide' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Data Entry Guide
          </button>
        </div>
      </div>

      {/* TAB 1: EASY FACULTY INGESTION STUDIO */}
      {activeSubTab === 'ingestion' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Ingestion Input Form with Gemini Backlight Halo */}
          <div className="lg:col-span-6 space-y-4">
            <GeminiBacklight showBadge badgeLabel="Gemini 2.0 Ingestion Parser">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-4 transition-colors duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Faculty Data Ingestion Form</h3>
                  </div>
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                    Gemini AI Auto-Parsing
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Faculty members do <strong>not</strong> need to manually format complex JSON. Simply paste Job Descriptions, syllabus documents, or recruiter notes below.
                </p>

                {/* Input Type Radio Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Input Document Type:</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setIngestType('jd')}
                      className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition cursor-pointer ${
                        ingestType === 'jd' 
                          ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-200 font-semibold' 
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Job Description (JD)</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Roles, CTC, Eligibility, Rounds</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIngestType('syllabus')}
                      className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition cursor-pointer ${
                        ingestType === 'syllabus' 
                          ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-200 font-semibold' 
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Syllabus / Topic Notes</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Algorithms, DS, Quant topics</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIngestType('interview_notes')}
                      className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition cursor-pointer ${
                        ingestType === 'interview_notes' 
                          ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-200 font-semibold' 
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Interview Experiences</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Alumni feedback, Question patterns</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIngestType('market_update')}
                      className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition cursor-pointer ${
                        ingestType === 'market_update' 
                          ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-200 font-semibold' 
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">2026 Recruiter Shift</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Industry expectations, Core skills</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Target Company */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Associated Target Company:</label>
                  <select
                    id="rag-target-company"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="General Placement Preparation">General Placement Preparation (All Companies)</option>
                  </select>
                </div>

                {/* Text Area */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Paste Unstructured Data / Syllabus / JD:</label>
                  <textarea
                    id="rag-raw-text"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Paste document text here...\n\nExample:\n"TCS Digital 2026 Drive:\nRole: Software Engineer / System Innovator (7.5 to 9 LPA)\nEligibility: CSBS, CSE, IT with CGPA >= 7.0 and no active backlogs.\nTesting Rounds: 1. Advanced Quant & Verbal (40 min) 2. Technical Coding with Data Structure evaluations (60 min) 3. AI Technical Interview.\nTopics: Dynamic Programming, Trees, Operating Systems, Speed Math."`}
                    className="w-full h-44 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 transition font-mono leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRawText(`Persistent Systems Campus Hiring Update (2026-27):
Job Role: Software Product Engineer
CTC: 8.5 LPA (Fixed + Performance Incentive)
Eligibility Criteria: Minimum 7.0 CGPA, 0 active backlogs. Branches: CSBS, CSE, IT.
Selection Process:
1. Online Assessment: 30 Quant & Logical Questions, 20 Core CS (Operating Systems, DBMS, Networks, Data Structures).
2. Coding Round: 2 algorithmic challenges in C/C++/Java. Focus on memory efficiency, dynamic programming, and clean modular code.
3. AI Technical Interview: Deep questions on OS Deadlocks, B-Trees, and System Architecture.
4. HR & Leadership Fit.`);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold underline cursor-pointer"
                  >
                    Load Sample Faculty Note
                  </button>

                  <button
                    id="rag-process-btn"
                    type="button"
                    onClick={handleIngest}
                    disabled={isProcessing || !rawText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Parsing with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Process &amp; Extract Data</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </GeminiBacklight>
          </div>

          {/* Right: AI Parsed Structured Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs min-h-[480px] flex flex-col justify-between transition-colors duration-500">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">AI Agent Parsing Output</h3>
                  </div>
                  {parsedResult && (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Ready to Sync</span>
                    </span>
                  )}
                </div>

                {!parsedResult ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div className="max-w-xs text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Enter raw data on the left and click <strong>"Process &amp; Extract Data"</strong>. 
                      The AI agent will decompose it into structured drive configs, MCQs, coding specs, and RAG vector chunks.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    
                    {/* Summary */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Extraction Summary</div>
                      <div className="text-slate-900 dark:text-slate-100 mt-1 font-medium">{parsedResult.summary}</div>
                    </div>

                    {/* Company Profile Details */}
                    {parsedResult.companyProfile && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Company &amp; Eligibility Specs</div>
                        <div className="grid grid-cols-2 gap-2 text-slate-800 dark:text-slate-200">
                          <div><strong>Company:</strong> {parsedResult.companyProfile.name}</div>
                          <div><strong>Package:</strong> {parsedResult.companyProfile.packageRange || 'N/A'}</div>
                          <div><strong>Min CGPA:</strong> {parsedResult.companyProfile.minCgpa || 6.5}</div>
                          <div><strong>Max Backlogs:</strong> {parsedResult.companyProfile.maxBacklogs ?? 0}</div>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          <strong>Eligible Branches:</strong> {parsedResult.companyProfile.eligibleBranches?.join(', ') || 'All'}
                        </div>
                      </div>
                    )}

                    {/* Hiring Rounds */}
                    {parsedResult.hiringRounds && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Evaluated Rounds ({parsedResult.hiringRounds.length})</div>
                        <div className="space-y-1">
                          {parsedResult.hiringRounds.map((r: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md">
                              <span>Round {r.roundNumber || idx + 1}: <strong>{r.name}</strong></span>
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{r.durationMin} mins • {r.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extracted Questions Preview */}
                    {parsedResult.extractedQuestions && parsedResult.extractedQuestions.length > 0 && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                          Auto-Generated MCQ Bank ({parsedResult.extractedQuestions.length} Questions)
                        </div>
                        <div className="text-[11px] text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-md">
                          <strong>Q1:</strong> {parsedResult.extractedQuestions[0].question}
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                            ✓ Correct: {parsedResult.extractedQuestions[0].options?.[parsedResult.extractedQuestions[0].correctIndex]}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RAG Chunks Preview */}
                    {parsedResult.ragChunks && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                          Generated Vector RAG Chunks ({parsedResult.ragChunks.length})
                        </div>
                        <div className="text-[11px] text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-md">
                          {parsedResult.ragChunks[0].content}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {parsedResult && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setParsedResult(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                  >
                    Discard
                  </button>

                  <button
                    id="rag-save-parsed-btn"
                    onClick={handleCommitParsedData}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save to RAG Knowledge Base &amp; Tests</span>
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* TAB 2: MARKET TREND SUGGESTIONS */}
      {activeSubTab === 'suggestions' && (
        <div className="space-y-4">
          <GeminiBacklight intensity="subtle" showBadge badgeLabel="Gemini Market Intelligence Agent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors duration-500">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Live Market Trends Agent Scanner</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                  AI continuously benchmarks 2026 recruiter patterns from tech employers and recommends adjustments to syllabus and question pools.
                </p>
              </div>

              <button
                id="rag-trigger-scan-btn"
                onClick={onRunMarketScan}
                disabled={isScanning}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning Industry Trends...' : 'Trigger Market AI Scan'}</span>
              </button>
            </div>
          </GeminiBacklight>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketSuggestions.map((sug) => (
              <motion.div
                key={sug.id}
                whileHover={{ y: -2 }}
                className={`p-5 rounded-2xl border backdrop-blur-xl transition flex flex-col justify-between ${
                  sug.status === 'approved'
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-xs'
                    : sug.status === 'rejected'
                    ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 opacity-60'
                    : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider">{sug.company}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        Scope: {sug.impactScope}
                      </span>
                      <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        {sug.confidence}% Match
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sug.trendTitle}</h4>

                  <div className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50/90 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 leading-relaxed font-medium">
                    <strong className="text-slate-900 dark:text-white">Detected Recruiter Shift:</strong> {sug.detectedShift}
                  </div>

                  <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/50 p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-800 leading-relaxed font-medium">
                    <strong className="text-emerald-900 dark:text-emerald-200">Automated Recommendation:</strong> {sug.recommendedAction}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 flex items-center justify-between">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Detected: {new Date(sug.detectedAt).toLocaleDateString()}
                  </div>

                  {sug.status === 'pending' ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onRejectSuggestion(sug.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => onApproveSuggestion(sug.id)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>1-Click Approve &amp; Deploy</span>
                      </button>
                    </div>
                  ) : (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      sug.status === 'approved' 
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                        : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}>
                      {sug.status.toUpperCase()}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RAG VECTOR CHUNKS EXPLORER */}
      {activeSubTab === 'chunks' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors duration-500">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="rag-search-input"
                type="text"
                placeholder="Search vector knowledge chunks by keyword, tag, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                id="rag-category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="aptitude_patterns">Aptitude Patterns</option>
                <option value="c_interview_questions">C &amp; Technical Questions</option>
                <option value="interview_experiences">Interview Experiences</option>
                <option value="market_trends">Market Trends</option>
                <option value="syllabus_breakdown">Syllabus Breakdown</option>
              </select>
            </div>
          </div>

          {/* Chunks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredChunks.map((chunk) => (
              <div key={chunk.id} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-3 transition-colors duration-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{chunk.companyName}</span>
                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    {chunk.category.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 leading-relaxed font-sans">
                  "{chunk.rawText}"
                </div>

                <div className="text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 p-2.5 rounded-xl font-medium">
                  <strong>AI RAG Takeaway:</strong> {chunk.aiSummarizedTakeaway}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {chunk.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-mono border border-slate-200 dark:border-slate-700">
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Source: {chunk.sourceDocument}</span>
                  <span>Ingested by: {chunk.ingestedByFaculty}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 4: FACULTY DATA ENTRY FORMAT GUIDE */}
      {activeSubTab === 'format_guide' && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-6 transition-colors duration-500">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Faculty Data Entry Specification &amp; Format Guide</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Detailed reference on how domain expert faculty members provide input into PlacementPro with zero manual coding friction.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Format 1 */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Format 1: Unstructured Text / PDF Paste</h4>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-bold">Recommended</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Faculty simply copy-pastes the raw Job Description, brochure text, or email from the recruiter.
              </p>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-lg text-[11px] text-slate-800 dark:text-slate-200 font-mono">
                "Company: Persistent Systems<br/>
                Role: Software Product Engineer (8.5 LPA)<br/>
                Eligibility: 7.0 CGPA, No live backlogs<br/>
                Rounds: Quant (30 min), Coding (60 min), Technical Interview."
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                <strong>AI Action:</strong> Gemini AI extracts company profile, generates 4-round pipeline, generates test cases, and stores vector embeddings.
              </p>
            </div>

            {/* Format 2 */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Format 2: Question Pool / Syllabus Markdown</h4>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-bold">High Speed</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                For Aptitude and Technical questions, faculty can paste numbered lists with options or bullet points.
              </p>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-lg text-[11px] text-slate-800 dark:text-slate-200 font-mono">
                Q1. What is the time complexity of searching in a Balanced BST?<br/>
                A) O(1)  B) O(log N)  C) O(N)<br/>
                Answer: B (Logarithmic time)
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                <strong>AI Action:</strong> Parser generates structured MCQ objects with explanation and tags into the question bank.
              </p>
            </div>

            {/* Format 3 */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Format 3: Market Trend 1-Click Sync</h4>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">Zero Input</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Faculty does not need to enter any data. The background AI Market Agent monitors hiring patterns and suggests updates with 1-click approval.
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                <strong>Faculty Action:</strong> Review notification &rarr; Click <strong>"Approve &amp; Sync"</strong> &rarr; Drive rules and test pools update instantly.
              </p>
            </div>

            {/* Format 4 */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Format 4: Coding Challenges &amp; Constraints</h4>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-200 px-2 py-0.5 rounded font-bold">Hands-On Code</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                For coding rounds, faculty provides problem statements, test cases, and memory/runtime limits.
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                <strong>Platform Action:</strong> Auto-generates test harness and validates student solutions against hidden test cases.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
