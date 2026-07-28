import { ApplicationStatus } from '../types';

export const getStatusBadgeVariant = (status: ApplicationStatus): string => {
  switch (status) {
    case 'Selected':
      return 'success';
    case 'Shortlisted':
    case 'Technical Round':
    case 'HR Round':
      return 'primary';
    case 'Under Review':
    case 'Applied':
      return 'warning';
    case 'Rejected':
      return 'danger';
    default:
      return 'secondary';
  }
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};
