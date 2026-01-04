import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import {
  JobApplication,
  Interview,
  ApplicationStatus,
  ApplicationType,
  InterviewType,
  mapDbToApplication,
  mapDbToInterview,
  DbJobApplication,
  DbInterview,
} from '@/types/application';

export function useApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch applications with interviews
  const fetchApplications = useCallback(async () => {
    if (!user) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch applications
      const { data: appsData, error: appsError } = await supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // Fetch all interviews for these applications
      const { data: interviewsData, error: interviewsError } = await supabase
        .from('interviews')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (interviewsError) throw interviewsError;

      // Map and combine
      const mappedApps = (appsData || []).map((app: DbJobApplication) => {
        const appInterviews = (interviewsData || []).filter(
          (i: DbInterview) => i.application_id === app.id
        );
        return mapDbToApplication(app, appInterviews);
      });

      setApplications(mappedApps);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const addApplication = useCallback(
    async (data: {
      jobTitle: string;
      companyName: string;
      companyWebsite?: string;
      contactInfo?: string;
      dateApplied: string;
      applicationType: ApplicationType;
      status: ApplicationStatus;
      notes?: string;
      interviews?: Array<{
        type: InterviewType;
        scheduledDate: string;
        interviewerName?: string;
        notes?: string;
        followUp?: string;
        completed: boolean;
      }>;
    }) => {
      if (!user) return null;

      try {
        // Insert application
        const { data: appData, error: appError } = await supabase
          .from('job_applications')
          .insert({
            user_id: user.id,
            job_title: data.jobTitle,
            company_name: data.companyName,
            company_website: data.companyWebsite || null,
            contact_info: data.contactInfo || null,
            date_applied: data.dateApplied,
            application_type: data.applicationType,
            status: data.status,
            notes: data.notes || null,
          })
          .select()
          .single();

        if (appError) throw appError;

        // Insert interviews if any
        if (data.interviews && data.interviews.length > 0) {
          const interviewsToInsert = data.interviews.map((i) => ({
            application_id: appData.id,
            user_id: user.id,
            interview_type: i.type,
            scheduled_date: i.scheduledDate,
            interviewer_name: i.interviewerName || null,
            notes: i.notes || null,
            follow_up: i.followUp || null,
            completed: i.completed,
          }));

          await supabase.from('interviews').insert(interviewsToInsert);
        }

        await fetchApplications();
        return appData;
      } catch (error) {
        console.error('Error adding application:', error);
        return null;
      }
    },
    [user, fetchApplications]
  );

  const updateApplication = useCallback(
    async (
      id: string,
      data: {
        jobTitle?: string;
        companyName?: string;
        companyWebsite?: string;
        contactInfo?: string;
        dateApplied?: string;
        applicationType?: ApplicationType;
        status?: ApplicationStatus;
        notes?: string;
        interviews?: Array<{
          id?: string;
          type: InterviewType;
          scheduledDate: string;
          interviewerName?: string;
          notes?: string;
          followUp?: string;
          completed: boolean;
        }>;
      }
    ) => {
      if (!user) return;

      try {
        // Update application
        const updatePayload: Record<string, unknown> = {};
        if (data.jobTitle !== undefined) updatePayload.job_title = data.jobTitle;
        if (data.companyName !== undefined) updatePayload.company_name = data.companyName;
        if (data.companyWebsite !== undefined) updatePayload.company_website = data.companyWebsite || null;
        if (data.contactInfo !== undefined) updatePayload.contact_info = data.contactInfo || null;
        if (data.dateApplied !== undefined) updatePayload.date_applied = data.dateApplied;
        if (data.applicationType !== undefined) updatePayload.application_type = data.applicationType;
        if (data.status !== undefined) updatePayload.status = data.status;
        if (data.notes !== undefined) updatePayload.notes = data.notes || null;

        if (Object.keys(updatePayload).length > 0) {
          const { error } = await supabase
            .from('job_applications')
            .update(updatePayload)
            .eq('id', id);

          if (error) throw error;
        }

        // Handle interviews
        if (data.interviews !== undefined) {
          // Delete existing interviews for this application
          await supabase.from('interviews').delete().eq('application_id', id);

          // Insert new interviews
          if (data.interviews.length > 0) {
            const interviewsToInsert = data.interviews.map((i) => ({
              application_id: id,
              user_id: user.id,
              interview_type: i.type,
              scheduled_date: i.scheduledDate,
              interviewer_name: i.interviewerName || null,
              notes: i.notes || null,
              follow_up: i.followUp || null,
              completed: i.completed,
            }));

            await supabase.from('interviews').insert(interviewsToInsert);
          }
        }

        await fetchApplications();
      } catch (error) {
        console.error('Error updating application:', error);
      }
    },
    [user, fetchApplications]
  );

  const deleteApplication = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from('job_applications')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await fetchApplications();
      } catch (error) {
        console.error('Error deleting application:', error);
      }
    },
    [user, fetchApplications]
  );

  const getApplication = useCallback(
    (id: string) => {
      return applications.find((app) => app.id === id);
    },
    [applications]
  );

  // Get upcoming interviews (next 7 days)
  const upcomingInterviews = applications
    .flatMap((app) =>
      app.interviews
        .filter((i) => {
          if (i.completed) return false;
          const interviewDate = new Date(i.scheduledDate);
          const now = new Date();
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return interviewDate >= now && interviewDate <= weekFromNow;
        })
        .map((i) => ({
          ...i,
          application: app,
        }))
    )
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  return {
    applications,
    isLoading,
    addApplication,
    updateApplication,
    deleteApplication,
    getApplication,
    upcomingInterviews,
    refetch: fetchApplications,
  };
}
