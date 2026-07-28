import React, { createContext, useContext, useState } from 'react';
import { JobDrive, JobApplication, ApplicationStatus } from '../types';
import { mockJobDrives, mockApplications } from '../data/mockData';

interface PlacementContextType {
  jobDrives: JobDrive[];
  applications: JobApplication[];
  addJobDrive: (job: Omit<JobDrive, 'id' | 'applicantsCount'>) => void;
  applyForJob: (jobId: string, studentId: string, studentName: string, studentEmail: string, department: string, cgpa: number) => void;
  updateApplicationStatus: (appId: string, newStatus: ApplicationStatus) => void;
}

const PlacementContext = createContext<PlacementContextType | undefined>(undefined);

export const PlacementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobDrives, setJobDrives] = useState<JobDrive[]>(mockJobDrives);
  const [applications, setApplications] = useState<JobApplication[]>(mockApplications);

  const addJobDrive = (jobData: Omit<JobDrive, 'id' | 'applicantsCount'>) => {
    const newJob: JobDrive = {
      ...jobData,
      id: `job-${Date.now()}`,
      applicantsCount: 0,
    };
    setJobDrives((prev) => [newJob, ...prev]);
  };

  const applyForJob = (
    jobId: string,
    studentId: string,
    studentName: string,
    studentEmail: string,
    department: string,
    cgpa: number
  ) => {
    const targetJob = jobDrives.find((j) => j.id === jobId);
    if (!targetJob) return;

    const newApp: JobApplication = {
      id: `app-${Date.now()}`,
      jobId,
      jobTitle: targetJob.title,
      companyName: targetJob.companyName,
      studentId,
      studentName,
      studentEmail,
      department,
      cgpa,
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Applied',
    };

    setApplications((prev) => [newApp, ...prev]);
    setJobDrives((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, applicantsCount: j.applicantsCount + 1 } : j))
    );
  };

  const updateApplicationStatus = (appId: string, newStatus: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
  };

  return (
    <PlacementContext.Provider
      value={{
        jobDrives,
        applications,
        addJobDrive,
        applyForJob,
        updateApplicationStatus,
      }}
    >
      {children}
    </PlacementContext.Provider>
  );
};

export const usePlacement = () => {
  const context = useContext(PlacementContext);
  if (!context) {
    throw new Error('usePlacement must be used within a PlacementProvider');
  }
  return context;
};
