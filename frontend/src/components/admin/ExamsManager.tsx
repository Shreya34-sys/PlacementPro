import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Loader2, 
  FileQuestion
} from 'lucide-react';
import { Question, CodingProblem, PlacementDrive } from '../types';
import { GeminiBacklight } from './GeminiBacklight';
import { motion } from 'motion/react';

interface ExamsManagerProps {
  questions: Question[];
  codingProblems: CodingProblem[];
  drives: PlacementDrive[];
  onAddQuestion: (q: Question) => void;
  onGenerateTestPaper: (company: string, role: string, difficulty: string) => Promise<any>;
}

export const ExamsManager: React.FC<ExamsManagerProps> = ({
  questions,
  codingProblems,
  onGenerateTestPaper,
}) => {
  const [activeTab, setActiveTab] = useState<'mcq' | 'coding' | 'generator'>('mcq');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState<any>(null);

  // Generator form states
  const [genCompany, setGenCompany] = useState('Tata Consultancy Services (TCS)');
  const [genRole, setGenRole] = useState('Digital Engineer');
  const [genDifficulty, setGenDifficulty] = useState('Moderate');

  const categories = ['all', 'Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Technical Core', 'Core CS', 'Data Structures'];

  const filteredQuestions = questions.filter(q => {
    const matchesCat = selectedCategory === 'all' || q.category === selectedCategory;
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await onGenerateTestPaper(genCompany, genRole, genDifficulty);
      if (res && res.data) {
        setGeneratedPaper(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors duration-500">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Curriculum &amp; Evaluation Engine</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Question Bank &amp; Test Orchestrator</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            Manage aptitude tests, core technical MCQs, and coding challenges with 1-click AI test paper generation.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto">
          <button
            id="exams-tab-mcq"
            onClick={() => setActiveTab('mcq')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'mcq' 
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            MCQ Bank ({questions.length})
          </button>
          <button
            id="exams-tab-coding"
            onClick={() => setActiveTab('coding')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'coding' 
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Coding Challenges ({codingProblems.length})
          </button>
          <button
            id="exams-tab-generator"
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center space-x-1 cursor-pointer ${
              activeTab === 'generator' 
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>AI Test Paper Generator</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MCQ BANK */}
      {activeTab === 'mcq' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors duration-500">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="exams-search-input"
                type="text"
                placeholder="Search questions by topic, keyword, or company tag (e.g. 'trees', 'os_deadlocks')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                id="exams-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Questions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuestions.map((q) => (
              <motion.div 
                key={q.id} 
                whileHover={{ y: -2 }}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-3 transition-colors duration-500"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                    {q.category} • {q.topic}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    q.difficulty === 'Hard' 
                      ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50/90 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  {q.question}
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border flex items-center space-x-2 text-[11px] ${
                        i === q.correctIndex
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-mono font-bold text-slate-800 dark:text-slate-200">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium">
                  <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Explanation:</strong> {q.explanation}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Domain Expert: {q.addedBy}</span>
                  {q.marketTrendVerified && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>2026 Trend Verified</span>
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 2: CODING BANK */}
      {activeTab === 'coding' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {codingProblems.map((prob) => (
            <motion.div 
              key={prob.id} 
              whileHover={{ y: -2 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-3 transition-colors duration-500"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{prob.category}</span>
                <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                  {prob.difficulty}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{prob.title}</h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{prob.description}</p>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] space-y-1 font-mono">
                <div className="text-blue-700 dark:text-blue-300 font-bold">Problem Constraints:</div>
                <div className="text-slate-600 dark:text-slate-400">• Time Limit: 1.0s / Memory Limit: 256MB</div>
                <div className="text-slate-600 dark:text-slate-400">• Clean modular code with optimal space-time complexity</div>
              </div>

              <div className="flex flex-wrap gap-1">
                {prob.tags.map((t, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-mono border border-slate-200 dark:border-slate-700">
                    #{t}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* TAB 3: 1-CLICK AI TEST PAPER GENERATOR */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-5 space-y-4">
            <GeminiBacklight showBadge badgeLabel="Gemini 2.0 Curriculum Synthesizer">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-4 transition-colors duration-500">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">AI Test Paper Specification</h3>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Faculty can select target company syllabus and difficulty. Gemini AI will instantly construct a calibrated placement test paper with Aptitude, Core CS, and Coding problems.
                </p>

                <form onSubmit={handleGenerate} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">Target Company:</label>
                    <select
                      id="gen-company-select"
                      value={genCompany}
                      onChange={(e) => setGenCompany(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Tata Consultancy Services (TCS)">Tata Consultancy Services (TCS - NQT/Digital)</option>
                      <option value="Persistent Systems">Persistent Systems (SPE Track)</option>
                      <option value="Infosys">Infosys (DSE &amp; SP Track)</option>
                      <option value="Google India">Google India (STEP &amp; Early Career)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">Target Job Role:</label>
                    <input
                      id="gen-role-input"
                      type="text"
                      value={genRole}
                      onChange={(e) => setGenRole(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">Test Paper Difficulty:</label>
                    <select
                      id="gen-difficulty-select"
                      value={genDifficulty}
                      onChange={(e) => setGenDifficulty(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Moderate (Standard Placement)">Moderate (Standard Placement Screening)</option>
                      <option value="Advanced (TCS Digital / Tier-1)">Advanced (TCS Digital / Tier-1)</option>
                      <option value="Foundation (Speed &amp; Accuracy)">Foundation (Speed &amp; Accuracy)</option>
                    </select>
                  </div>

                  <button
                    id="gen-submit-btn"
                    type="submit"
                    disabled={isGenerating}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Calibrated Test Paper...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>1-Click Generate Placement Test Paper</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </GeminiBacklight>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs min-h-[460px] transition-colors duration-500">
              {!generatedPaper ? (
                <div className="flex flex-col items-center justify-center py-24 text-center text-slate-500 dark:text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FileQuestion className="w-6 h-6" />
                  </div>
                  <div className="max-w-xs text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Configure company options on the left and click <strong>"1-Click Generate Placement Test Paper"</strong>.
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{generatedPaper.testTitle}</h4>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">Duration: {generatedPaper.durationMin} mins • Total Marks: {generatedPaper.totalMarks}</div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Generated Ready
                    </span>
                  </div>

                  {/* Generated MCQs */}
                  {generatedPaper.mcqQuestions && (
                    <div className="space-y-2">
                      <div className="font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider text-[11px]">Quantitative &amp; Aptitude Section</div>
                      {generatedPaper.mcqQuestions.slice(0, 2).map((q: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                          <div className="font-bold text-slate-900 dark:text-white">{q.question}</div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">✓ Option {String.fromCharCode(65 + q.correctIndex)}: {q.options?.[q.correctIndex]}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Generated Core Questions */}
                  {generatedPaper.cQuestions && (
                    <div className="space-y-2">
                      <div className="font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider text-[11px]">Core CS &amp; Algorithms Section</div>
                      {generatedPaper.cQuestions.slice(0, 2).map((q: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 font-mono">
                          <div className="font-bold text-slate-900 dark:text-white">{q.question}</div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">✓ Correct: {q.options?.[q.correctIndex]}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Generated Coding Problem */}
                  {generatedPaper.codingProblem && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1.5">
                      <div className="font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider text-[11px]">Coding Challenge</div>
                      <div className="font-bold text-slate-900 dark:text-white">{generatedPaper.codingProblem.title}</div>
                      <div className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">{generatedPaper.codingProblem.description}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
