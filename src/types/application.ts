import { Tables, Enums } from '@/integrations/supabase/types';

// Database enum types
export type ApplicationStatus = Enums<'application_status'>;
export type ApplicationType = Enums<'application_type'>;
export type InterviewType = Enums<'interview_type'>;

// Database row types
export type DbJobApplication = Tables<'job_applications'>;
export type DbInterview = Tables<'interviews'>;

// Mapped types for display (snake_case to camelCase)
export interface Interview {
  id: string;
  applicationId: string;
  userId: string;
  type: InterviewType;
  scheduledDate: string;
  interviewerName?: string;
  notes?: string;
  followUp?: string;
  completed: boolean;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  userId: string;
  jobTitle: string;
  companyName: string;
  companyWebsite?: string;
  contactInfo?: string;
  dateApplied: string;
  applicationType: ApplicationType;
  status: ApplicationStatus;
  notes?: string;
  interviews: Interview[];
  createdAt: string;
  updatedAt: string;
}

// Mappers
export function mapDbToInterview(db: DbInterview): Interview {
  return {
    id: db.id,
    applicationId: db.application_id,
    userId: db.user_id,
    type: db.interview_type,
    scheduledDate: db.scheduled_date,
    interviewerName: db.interviewer_name ?? undefined,
    notes: db.notes ?? undefined,
    followUp: db.follow_up ?? undefined,
    completed: db.completed,
    reminderSent: db.reminder_sent,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapDbToApplication(
  db: DbJobApplication,
  interviews: DbInterview[] = []
): JobApplication {
  return {
    id: db.id,
    userId: db.user_id,
    jobTitle: db.job_title,
    companyName: db.company_name,
    companyWebsite: db.company_website ?? undefined,
    contactInfo: db.contact_info ?? undefined,
    dateApplied: db.date_applied,
    applicationType: db.application_type,
    status: db.status,
    notes: db.notes ?? undefined,
    interviews: interviews.map(mapDbToInterview),
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// Status display helpers
export const statusDisplayMap: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  under_review: 'Under Review',
  interview_stage: 'Interview Stage',
  offer_received: 'Offer Received',
  rejected: 'Rejected',
  employed: 'Employed',
  offer_declined: 'Offer Declined',
  withdrawn: 'Withdrawn',
};

export const typeDisplayMap: Record<ApplicationType, string> = {
  job: 'Job',
  bootcamp: 'Bootcamp',
  internship: 'Internship',
  freelance: 'Freelance',
  contract: 'Contract',
  other: 'Other',
};

export const interviewTypeDisplayMap: Record<InterviewType, string> = {
  phone_screen: 'Phone Screen',
  technical: 'Technical',
  behavioral: 'Behavioral',
  final: 'Final',
  other: 'Other',
};
