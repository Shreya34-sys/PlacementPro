import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  ArrowRight,
  X
} from 'lucide-react';
import { PlacementDrive, Company, StudentAnalytics } from '../types';
import { motion } from 'motion/react';

interface DrivesManagerProps {
  drives: PlacementDrive[];
  companies: Company[];
  students: StudentAnalytics[];
  onAddDrive: (drive: PlacementDrive) => void;
  onUpdateDrive: (drive: PlacementDrive) => void;
}

export const DrivesManager: React.FC<DrivesManagerProps> = ({
  drives,
  companies,
  students,
  onAddDrive,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || '');
  const [roleTitle, setRoleTitle] = useState('Software Engineer - 2026 Batch');
  const [ctc, setCtc] = useState('8.0 LPA');
  const [minCgpa, setMinCgpa] = useState<number>(6.5);
  const [maxBacklogs, setMaxBacklogs] = useState<number>(0);
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['CSBS', 'CSE', 'IT']);
  const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(drives[0] || null);

  const branches = ['CSBS', 'CSE', 'IT', 'ENTC', 'Electrical', 'Mechanical', 'Civil'];

  const toggleBranch = (b: string) => {
    if (selectedBranches.includes(b)) {
      setSelectedBranches(selectedBranches.filter(x => x !== b));
    } else {
      setSelectedBranches([...selectedBranches, b]);
    }
  };

  // Calculate eligible students count in real-time
  const eligibleStudents = students.filter(s => {
    const cgpaOk = s.cgpa >= minCgpa;
    const branchOk = selectedBranches.some(b => s.branch.includes(b));
    return cgpaOk && branchOk;
  });

  const handleCreateDrive = (e: React.FormEvent) => {
    e.preventDefault();
    const comp = companies.find(c => c.id === selectedCompanyId) || companies[0];

    const newDrive: PlacementDrive = {
      id: `drive_${Date.now()}`,
      companyId: comp.id,
      companyName: comp.name,
      roleTitle,
      ctc,
      batch: '2026-27 Batch',
      status: 'active',
      startDate: new Date().toISOString(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      eligibility: {
        minCgpa,
        maxBacklogs,
        allowedBranches: selectedBranches,
        allowedGenders: 'all',
      },
      roundsConfig: [
        { roundNumber: 1, name: 'Foundation Aptitude Test', type: 'aptitude', cutoffPercent: 65, isProctored: true },
        { roundNumber: 2, name: 'Technical Coding Round', type: 'technical_test', cutoffPercent: 70, isProctored: true },
        { roundNumber: 3, name: 'AI Technical Interview Simulation', type: 'ai_interview', cutoffPercent: 75, isProctored: true },
        { roundNumber: 4, name: 'Behavioral & Leadership HR', type: 'hr_interview', cutoffPercent: 60, isProctored: false },
      ],
      registeredCount: eligibleStudents.length,
      shortlistedCount: Math.round(eligibleStudents.length * 0.7),
      placedCount: 0,
      createdBy: 'Faculty Domain Expert',
    };

    onAddDrive(newDrive);
    setShowCreateModal(false);
    setSelectedDrive(newDrive);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* Header & Launch Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors duration-500">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Campus Placement Pipeline</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Drive &amp; Eligibility Orchestrator</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            Configure recruitment drives, define branch/CGPA cutoff filters, and assemble 4-stage evaluation pipelines.
          </p>
        </div>

        <button
          id="drives-launch-btn"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Launch New Campus Drive</span>
        </button>
      </div>

      {/* Drives Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Drives Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-1">
            Active Placement Drives ({drives.length})
          </div>

          <div className="space-y-3">
            {drives.map((drive) => {
              const isSelected = selectedDrive?.id === drive.id;
              return (
                <motion.div
                  key={drive.id}
                  id={`drive-card-${drive.id}`}
                  onClick={() => setSelectedDrive(drive)}
                  whileHover={{ y: -2 }}
                  className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 shadow-md ring-1 ring-blue-500'
                      : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{drive.companyName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md">
                          {drive.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 font-bold mt-0.5">{drive.roleTitle}</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1">Package: {drive.ctc}</div>
                    </div>
                    <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`} />
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    <span>Min CGPA: <strong className="text-slate-900 dark:text-slate-200">{drive.eligibility.minCgpa}</strong></span>
                    <span><strong className="text-slate-900 dark:text-slate-200">{drive.registeredCount}</strong> Registered</span>
                    <span><strong className="text-slate-900 dark:text-slate-200">{drive.roundsConfig.length}</strong> Rounds</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Drive Details & Screening Inspector (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedDrive ? (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-5 transition-colors duration-500">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{selectedDrive.companyName}</h3>
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-bold">{selectedDrive.roleTitle} • {selectedDrive.ctc}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Batch Target</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{selectedDrive.batch}</div>
                </div>
              </div>

              {/* Eligibility Criteria */}
              <div className="p-4 bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Automated Eligibility Rules</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <div>• Minimum CGPA: <strong className="text-slate-900 dark:text-white">{selectedDrive.eligibility.minCgpa}</strong></div>
                  <div>• Maximum Live Backlogs: <strong className="text-slate-900 dark:text-white">{selectedDrive.eligibility.maxBacklogs}</strong></div>
                  <div className="col-span-2">• Allowed Branches: <strong className="text-slate-900 dark:text-white">{selectedDrive.eligibility.allowedBranches.join(', ')}</strong></div>
                </div>
              </div>

              {/* Rounds Pipeline */}
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">Evaluated Rounds Pipeline</div>
                <div className="space-y-2">
                  {selectedDrive.roundsConfig.map((round, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px]">
                          {round.roundNumber}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{round.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Type: {round.type} • Cutoff: {round.cutoffPercent}%</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        round.isProctored 
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {round.isProctored ? 'AI Proctored' : 'Standard'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eligible Candidates Preview */}
              <div className="p-4 bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Eligible Batch Candidates ({selectedDrive.registeredCount})
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">100% Verified in System</span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {students.slice(0, 4).map((s) => (
                    <div key={s.studentId} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white">{s.studentName}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({s.usn})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">CGPA: {s.cgpa}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Ready ({s.readinessScore}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-xs">Select a drive to inspect details.</div>
          )}
        </div>

      </div>

      {/* CREATE DRIVE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100"
          >
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Configure New Campus Drive</h3>
              <button 
                id="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDrive} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Select Recruiting Company</label>
                <select
                  id="modal-company-select"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.tier})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Job Role Title</label>
                  <input
                    id="modal-role-input"
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Offered CTC Package</label>
                  <input
                    id="modal-ctc-input"
                    type="text"
                    value={ctc}
                    onChange={(e) => setCtc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Minimum CGPA Cutoff</label>
                  <input
                    id="modal-cgpa-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Max Active Backlogs</label>
                  <input
                    id="modal-backlogs-input"
                    type="number"
                    min="0"
                    max="5"
                    value={maxBacklogs}
                    onChange={(e) => setMaxBacklogs(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">Eligible Engineering Branches</label>
                <div className="flex flex-wrap gap-1.5">
                  {branches.map((b) => {
                    const isChecked = selectedBranches.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBranch(b)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-blue-700 dark:text-blue-300 font-semibold">Matched Eligible Students:</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">{eligibleStudents.length} Students</span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="modal-submit-drive-btn"
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold transition cursor-pointer shadow-sm"
                >
                  Publish Campus Drive
                </button>
              </div>

            </form>

          </motion.div>
        </div>
      )}

    </div>
  );
};
