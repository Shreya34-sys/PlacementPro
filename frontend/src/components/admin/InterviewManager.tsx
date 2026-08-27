import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { AIInterviewSession } from '../types';
import { GeminiBacklight } from './GeminiBacklight';
import { motion } from 'motion/react';

interface InterviewManagerProps {
  interviews: AIInterviewSession[];
}

export const InterviewManager: React.FC<InterviewManagerProps> = ({ interviews }) => {
  const [selectedInterview, setSelectedInterview] = useState<AIInterviewSession>(interviews[0]);
  const [searchQuery] = useState('');

  const filteredInterviews = interviews.filter(i => 
    i.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.targetCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.interviewerPersona.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors duration-500">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4" />
            <span>GenAI Voice &amp; Code Interview Agent</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">AI Technical Interview Orchestrator &amp; Evaluation</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            Evaluate candidate transcripts, algorithmic depth, architectural explanations, and behavioral fit.
          </p>
        </div>
      </div>

      {/* Grid: Candidate List & Transcript Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Sessions List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-1">
            Completed Interviews ({interviews.length})
          </div>

          <div className="space-y-2.5">
            {filteredInterviews.map((session) => {
              const isSelected = selectedInterview?.id === session.id;
              return (
                <motion.div
                  key={session.id}
                  id={`interview-card-${session.id}`}
                  onClick={() => setSelectedInterview(session)}
                  whileHover={{ y: -2 }}
                  className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 shadow-md ring-1 ring-blue-500'
                      : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{session.studentName}</div>
                      <div className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold mt-0.5">
                        Target: {session.targetCompany}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Persona: {session.interviewerPersona}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{session.overallScore}%</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Score</div>
                    </div>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>{session.transcript.length} Exchanges</span>
                    <span>{new Date(session.conductedAt).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Transcript & Scoring Matrix (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedInterview ? (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-5 transition-colors duration-500">
              
              {/* Top Banner */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{selectedInterview.studentName}</h3>
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-bold">
                    {selectedInterview.targetCompany} Mock Interview • Evaluator: {selectedInterview.interviewerPersona}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-right">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-bold block">Overall Score</span>
                    <span className="text-base font-black text-emerald-800 dark:text-emerald-200">{selectedInterview.overallScore}/100</span>
                  </div>
                </div>
              </div>

              {/* Competency Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-3 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Technical Core</div>
                  <div className="text-sm font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">{selectedInterview.breakdown.technical}%</div>
                </div>
                <div className="p-3 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Core Languages</div>
                  <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{selectedInterview.breakdown.cMastery}%</div>
                </div>
                <div className="p-3 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Problem Solving</div>
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedInterview.breakdown.problemSolving}%</div>
                </div>
                <div className="p-3 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Communication</div>
                  <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{selectedInterview.breakdown.communication}%</div>
                </div>
              </div>

              {/* AI Evaluator Feedback with Gemini Aura Backlight */}
              <GeminiBacklight showBadge badgeLabel="Gemini 2.0 Evaluation Assessment">
                <div className="p-4 bg-blue-50/90 dark:bg-slate-800/90 border border-blue-200/80 dark:border-slate-700 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300 font-bold">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>AI Evaluator Assessment &amp; Feedback</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-[11px] font-medium">
                    {selectedInterview.feedback}
                  </p>
                </div>
              </GeminiBacklight>

              {/* Live Transcript View */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>Dialogue Transcript ({selectedInterview.transcript.length} Exchanges)</span>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
                  {selectedInterview.transcript.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                        msg.speaker === 'AI Interviewer'
                          ? 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 ml-0 mr-8'
                          : 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-slate-900 dark:text-slate-100 ml-8 mr-0'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={`font-bold ${msg.speaker === 'AI Interviewer' ? 'text-blue-700 dark:text-blue-300' : 'text-blue-600 dark:text-blue-400'}`}>
                          {msg.speaker}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{msg.timestamp}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium">{msg.message}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400 text-xs">Select an interview to view transcript.</div>
          )}
        </div>

      </div>

    </div>
  );
};
