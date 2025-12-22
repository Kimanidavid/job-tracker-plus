export type ApplicationStatus = 
  | 'Applied' 
  | 'Under Review' 
  | 'Interview Stage' 
  | 'Offer Received' 
  | 'Rejected' 
  | 'Employed'
  | 'Offer Declined'
  | 'Withdrawn';

export type ApplicationType = 
  | 'Job' 
  | 'Bootcamp' 
  | 'Internship' 
  | 'Freelance' 
  | 'Contract';

export type InterviewType = 
  | 'Phone Screen' 
  | 'Technical' 
  | 'Behavioral' 
  | 'Final' 
  | 'HR' 
  | 'Other';

export interface Interview {
  id: string;
  type: InterviewType;
  date: string;
  interviewerName?: string;
  notes?: string;
  followUp?: string;
  completed: boolean;
}

export interface JobApplication {
  id: string;
  jobTitle: string;
  companyName: string;
  companyWebsite?: string;
  contactInfo?: string;
  dateApplied: string;
  applicationType: ApplicationType;
  status: ApplicationStatus;
  interviews: Interview[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
