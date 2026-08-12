import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { Search, Map, Play, Briefcase, Code2, Users, Calendar, Filter } from 'lucide-react';

interface CompanyPrepPageProps {
  onNavigate: (tab: string, jobId?: string) => void;
}

export interface CompanyPrepData {
  id: string;
  name: string;
  type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  packageRange: string;
  roles: string[];
  progress: {
    completed: number;
    inProgress: number;
    remaining: number;
    total: number;
  };
  questionsCount: number;
  experiencesCount: number;
  lastUpdated: string;
  tags: string[];
}

const mockCompanies: CompanyPrepData[] = [
  {
    id: 'google',
    name: 'Google',
    type: 'Product Company',
    difficulty: 'Hard',
    packageRange: '₹28 - 45 LPA',
    roles: ['SDE', 'Data Engineer'],
    progress: { completed: 45, inProgress: 12, remaining: 293, total: 350 },
    questionsCount: 350,
    experiencesCount: 124,
    lastUpdated: '2 days ago',
    tags: ['Product Companies', 'Dream Companies', 'Visited Companies'],
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    type: 'Product Company',
    difficulty: 'Hard',
    packageRange: '₹40 - 52 LPA',
    roles: ['SDE', 'PM', 'QA'],
    progress: { completed: 80, inProgress: 5, remaining: 195, total: 280 },
    questionsCount: 280,
    experiencesCount: 98,
    lastUpdated: '1 week ago',
    tags: ['Product Companies', 'Dream Companies'],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    type: 'Product Company',
    difficulty: 'Hard',
    packageRange: '₹28 - 45 LPA',
    roles: ['SDE-1', 'Cloud Support'],
    progress: { completed: 120, inProgress: 20, remaining: 260, total: 400 },
    questionsCount: 400,
    experiencesCount: 215,
    lastUpdated: '3 days ago',
    tags: ['Product Companies', 'Dream Companies'],
  },
  {
    id: 'apple',
    name: 'Apple',
    type: 'Product Company',
    difficulty: 'Hard',
    packageRange: '₹35 - 50 LPA',
    roles: ['Software Engineer', 'Hardware'],
    progress: { completed: 10, inProgress: 5, remaining: 185, total: 200 },
    questionsCount: 200,
    experiencesCount: 45,
    lastUpdated: '2 weeks ago',
    tags: ['Product Companies', 'Dream Companies'],
  },
  {
    id: 'meta',
    name: 'Meta',
    type: 'Product Company',
    difficulty: 'Hard',
    packageRange: '₹45 - 60 LPA',
    roles: ['Frontend Engineer', 'SDE'],
    progress: { completed: 5, inProgress: 2, remaining: 243, total: 250 },
    questionsCount: 250,
    experiencesCount: 65,
    lastUpdated: '1 month ago',
    tags: ['Product Companies', 'Dream Companies'],
  },
  {
    id: 'tcs',
    name: 'TCS',
    type: 'Service Company',
    difficulty: 'Easy',
    packageRange: '₹3 - 9 LPA',
    roles: ['System Engineer', 'Digital'],
    progress: { completed: 150, inProgress: 0, remaining: 50, total: 200 },
    questionsCount: 200,
    experiencesCount: 350,
    lastUpdated: '1 day ago',
    tags: ['Service Companies', 'Visited Companies'],
  },
  {
    id: 'infosys',
    name: 'Infosys',
    type: 'Service Company',
    difficulty: 'Easy',
    packageRange: '₹3.6 - 8 LPA',
    roles: ['Systems Engineer', 'Specialist'],
    progress: { completed: 40, inProgress: 10, remaining: 100, total: 150 },
    questionsCount: 150,
    experiencesCount: 280,
    lastUpdated: '4 days ago',
    tags: ['Service Companies'],
  },
  {
    id: 'adobe',
    name: 'Adobe',
    type: 'Product Company',
    difficulty: 'Hard',
    packageRange: '₹30 - 40 LPA',
    roles: ['MTS', 'Data Scientist'],
    progress: { completed: 25, inProgress: 8, remaining: 147, total: 180 },
    questionsCount: 180,
    experiencesCount: 75,
    lastUpdated: '1 week ago',
    tags: ['Product Companies', 'Dream Companies', 'Internship'],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    type: 'Product Company',
    difficulty: 'Medium',
    packageRange: '₹25 - 35 LPA',
    roles: ['AMTS', 'QA'],
    progress: { completed: 0, inProgress: 0, remaining: 150, total: 150 },
    questionsCount: 150,
    experiencesCount: 42,
    lastUpdated: '2 weeks ago',
    tags: ['Product Companies', 'Internship'],
  },
];

export const CompanyPrepPage: React.FC<CompanyPrepPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredCompanies = useMemo(() => {
    return mockCompanies.filter((comp) => {
      const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            comp.roles.some(role => role.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFilter = activeFilter === 'All' ? true : comp.tags.includes(activeFilter);
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-16" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top Section */}
      <div className="bg-white border-b border-[#E5E7EB] pt-12 pb-8 px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[32px] font-bold text-gray-900 mb-3"
            >
              Company-wise Preparation
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[14px] text-gray-600 leading-relaxed"
            >
              Prepare for top product and service-based companies with structured roadmaps, coding questions, aptitude, interview experiences, and AI guidance.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
          >
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search companies or roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[48px] pl-11 pr-4 rounded-[12px] border border-gray-200 bg-[#F8FAFC] text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0" style={{ scrollbarWidth: 'none' }}>
              {['All', 'Product Companies', 'Service Companies', 'Dream Companies', 'Internship', 'Visited Companies'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`whitespace-nowrap h-[40px] px-4 rounded-full text-[14px] font-medium transition-all ${
                    activeFilter === filter 
                      ? 'bg-blue-600 text-white shadow-md border-transparent' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Results Info */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[22px] font-semibold text-gray-900">
            {activeFilter === 'All' ? 'All Companies' : activeFilter}
            <span className="ml-3 text-[14px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {filteredCompanies.length}
            </span>
          </h2>
          <button className="flex items-center gap-2 text-[14px] font-medium text-gray-500 hover:text-gray-700 transition-colors">
            <Filter className="w-4 h-4" /> Sort By
          </button>
        </div>

        {/* Company Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredCompanies.map((comp) => (
              <motion.div
                key={comp.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="bg-white rounded-[16px] p-[24px] shadow-sm border border-[#E5E7EB] hover:shadow-lg hover:border-blue-600 flex flex-col group h-full"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[12px] bg-gray-50 border border-gray-100 flex items-center justify-center p-2 shadow-sm group-hover:scale-105 transition-transform duration-250">
                      <CompanyLogo companyName={comp.name} size={40} />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-semibold text-gray-900 leading-tight mb-1">{comp.name}</h3>
                      <span className="text-[12px] font-medium text-gray-500 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" /> {comp.type}
                      </span>
                    </div>
                  </div>
                  
                  <span className={`px-2.5 py-1 rounded-[8px] text-[12px] font-medium border ${
                    comp.difficulty === 'Hard' ? 'bg-red-50 text-red-600 border-red-100' :
                    comp.difficulty === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                    'bg-green-50 text-green-600 border-green-100'
                  }`}>
                    {comp.difficulty}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-[#F8FAFC] rounded-[12px] border border-[#E5E7EB]">
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-0.5">Package Range</p>
                    <p className="text-[14px] font-semibold text-gray-900">{comp.packageRange}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 font-medium mb-0.5">Hiring Roles</p>
                    <p className="text-[14px] font-semibold text-gray-900 truncate" title={comp.roles.join(', ')}>
                      {comp.roles.slice(0, 2).join(', ')}{comp.roles.length > 2 ? ' +' : ''}
                    </p>
                  </div>
                </div>

                <div className="mb-5 flex-grow">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[12px] font-medium text-gray-600">Preparation Progress</p>
                    <span className="text-[14px] font-bold text-blue-600">{Math.round((comp.progress.completed / comp.progress.total) * 100)}%</span>
                  </div>
                  <div className="w-full h-[6px] bg-gray-100 rounded-full overflow-hidden mb-3">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(comp.progress.completed / comp.progress.total) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-medium text-gray-500">
                    <span className="text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{comp.progress.completed} Done</span>
                    <span className="text-orange-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>{comp.progress.inProgress} Doing</span>
                    <span className="text-gray-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>{comp.progress.remaining} Left</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 mb-6 text-[12px] font-medium text-gray-600">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-blue-500" />
                    <span>{comp.questionsCount} DSA Questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span>{comp.experiencesCount} Interview Experiences</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Updated {comp.lastUpdated}</span>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <button
                    onClick={() => onNavigate('company-prep-detail')}
                    className="w-full h-[44px] rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-current text-white" /> Start Preparation
                  </button>
                  <button
                    onClick={() => onNavigate('company-prep-detail')}
                    className="w-full h-[44px] rounded-full bg-white hover:bg-gray-50 text-blue-600 font-medium text-[14px] border border-blue-200 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Map className="w-4 h-4" /> View Roadmap
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {filteredCompanies.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-[18px] font-semibold text-gray-900 mb-2">No companies found</h3>
            <p className="text-[14px] text-gray-500">We couldn't find any companies matching your search criteria.</p>
            <button 
              onClick={() => {setSearchQuery(''); setActiveFilter('All');}}
              className="mt-4 px-6 h-[40px] rounded-full bg-blue-50 text-blue-600 font-medium text-[14px] hover:bg-blue-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
