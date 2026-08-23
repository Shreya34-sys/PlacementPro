export type UserRole = 'student' | 'recruiter' | 'tpo' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  batchYear?: string;
  cgpa?: number;
  phone?: string;
  resumeUrl?: string;
  companyName?: string;
  
  // Leaderboard statistics
  problemsSolved?: number;
  codingXp?: number;
  aptitudeScore?: number;
  interviewScore?: number;
  totalPoints?: number;
  streak?: number;
}

export type ApplicationStatus = 
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Technical Round'
  | 'HR Round'
  | 'Selected'
  | 'Rejected';

export interface JobDrive {
  id: string;
  companyName: string;
  companyLogo?: string;
  title: string;
  category: 'Full Time' | 'Internship' | 'PPO';
  location: string;
  ctc: string; // e.g., "$120,000 / yr" or "12 LPA"
  eligibilityCgpa: number;
  allowedBranches: string[];
  deadline: string;
  description: string;
  requirements: string[];
  status: 'Active' | 'Upcoming' | 'Closed';
  applicantsCount: number;
  driveDate: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  department: string;
  cgpa: number;
  appliedDate: string;
  status: ApplicationStatus;
  notes?: string;
}

export interface InterviewSchedule {
  id: string;
  jobId: string;
  companyName: string;
  roundName: string;
  date: string;
  time: string;
  mode: 'Online' | 'In-Person';
  venueOrLink: string;
  studentIds: string[];
}

export interface PracticeQuiz {
  id: string;
  title: string;
  category: 'Aptitude' | 'Coding' | 'System Design' | 'HR Interview';
  totalQuestions: number;
  durationMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface PlacementStat {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
}

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  location: string;
  industry: string;
  description?: string;
  openPositionsCount?: number;
  ctcRange?: string;
  website?: string;
}
