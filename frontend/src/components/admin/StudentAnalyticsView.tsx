import React, { useState } from 'react';
import { 
  Search, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { StudentAnalytics } from '../types';
import { motion } from 'motion/react';

interface StudentAnalyticsViewProps {
  students: StudentAnalytics[];
}

export const StudentAnalyticsView: React.FC<StudentAnalyticsViewProps> = ({ students = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalytics>(students[0] || null);

  const filteredStudents = students.filter(s => {
    const matchesSearch = (s.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.usn || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || (s.branch || '').toLowerCase().includes(selectedBranch.toLowerCase());
    return matchesSearch && matchesBranch;
  });

  const activeStudent = selectedStudent || filteredStudents[0] || null;

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors duration-500">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Placement Intelligence &amp; Skill Diagnostics</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Student Readiness &amp; Performance Matrix</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            Monitor batch readiness index, individual competency ratings, and target company tier predictions.
          </p>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs transition-colors duration-500">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Batch Readiness</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">88.5%</div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">↑ +5.2% after syllabus sync</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs transition-colors duration-500">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Registered Students</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{students.length}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">2026-27 CSBS &amp; Core Batch</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs transition-colors duration-500">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Core CS Mastery</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">91.4%</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">Algorithms &amp; System Fundamentals</div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs transition-colors duration-500">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Tier-1 Projected</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">42 Candidates</div>
          <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold mt-1">Google, TCS Digital, Persistent</div>
        </motion.div>
      </div>

      {/* Grid: Student Table & Deep Profile Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Students Roster (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-4 transition-colors duration-500">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="student-search-input"
                  type="text"
                  placeholder="Search student by name or USN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                id="student-branch-select"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Branches</option>
                <option value="CSBS">CSBS</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
              </select>
            </div>

            {/* Students Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Branch &amp; CGPA</th>
                    <th className="p-3">Readiness</th>
                    <th className="p-3">Predicted Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredStudents.map((s) => {
                    const isSelected = activeStudent?.studentId === s.studentId;
                    const tierDisplay = s.predictedPlacementTier || s.predictedTier || 'Tier-1 High CTC';
                    return (
                      <tr
                        key={s.studentId}
                        id={`student-row-${s.studentId}`}
                        onClick={() => setSelectedStudent(s)}
                        className={`cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-blue-50 dark:bg-blue-950/60 font-bold border-l-4 border-l-blue-600 dark:border-l-blue-400' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{s.studentName}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">{s.usn}</div>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          <div>{s.branch}</div>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">CGPA: {s.cgpa}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-emerald-600 dark:text-emerald-400">{s.readinessScore}%</span>
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${s.readinessScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            tierDisplay.includes('Tier 1') || tierDisplay.includes('Tier-1')
                              ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}>
                            {tierDisplay}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Right: Detailed Student Diagnostic Profile (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {activeStudent ? (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-5 transition-colors duration-500">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{activeStudent.studentName}</h3>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold">{activeStudent.usn} • {activeStudent.branch}</div>
                </div>

                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {activeStudent.readinessScore}% Ready
                </span>
              </div>

              {/* Competencies Progress Bars */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Placement Competency Matrix
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium mb-1">
                      <span>Quantitative Aptitude</span>
                      <span className="font-bold text-slate-900 dark:text-white">{activeStudent.competencies?.aptitude || 85}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                      <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: `${activeStudent.competencies?.aptitude || 85}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium mb-1">
                      <span>Coding &amp; Algorithm Mastery</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{activeStudent.competencies?.cCompilerMastery || 90}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                      <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-full" style={{ width: `${activeStudent.competencies?.cCompilerMastery || 90}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium mb-1">
                      <span>Data Structures &amp; Algorithms</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeStudent.competencies?.dsa || 88}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                      <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full" style={{ width: `${activeStudent.competencies?.dsa || 88}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium mb-1">
                      <span>Core CS (OS, DBMS, Networks)</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{activeStudent.competencies?.coreCS || 86}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                      <div className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full" style={{ width: `${activeStudent.competencies?.coreCS || 86}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium mb-1">
                      <span>AI Mock Interview Communication</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{activeStudent.competencies?.communication || 88}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                      <div className="h-full bg-purple-500 dark:bg-purple-400 rounded-full" style={{ width: `${activeStudent.competencies?.communication || 88}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl space-y-1 text-xs">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Identified Strengths:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(activeStudent.topStrengths && activeStudent.topStrengths.length > 0 
                      ? activeStudent.topStrengths 
                      : ['C/C++ Memory Management', 'DSA & Logic', 'System Architecture']
                    ).map((st, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                        {st}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl space-y-1 text-xs">
                  <div className="font-bold text-rose-700 dark:text-rose-300 flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Improvement Gaps:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(activeStudent.weakAreas && activeStudent.weakAreas.length > 0 
                      ? activeStudent.weakAreas 
                      : ['Advanced Graph Dynamic Programming', 'High-Speed Math Calculations']
                    ).map((w, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded font-bold border border-rose-200 dark:border-rose-800">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400 text-xs">Select a student to view diagnostic breakdown.</div>
          )}
        </div>

      </div>

    </div>
  );
};
