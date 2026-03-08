import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_base: boolean;
  created_at: string;
  updated_at: string;
}

export interface TailoredResume {
  id: string;
  user_id: string;
  base_resume_id: string | null;
  job_description: string;
  tailored_content: string;
  score: number | null;
  recommendations: any[];
  job_title: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

export function useResumes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resumesQuery = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Resume[];
    },
  });

  const baseResume = resumesQuery.data?.find(r => r.is_base) || null;

  const saveResume = useMutation({
    mutationFn: async (resume: { id?: string; title: string; content: string; is_base: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (resume.id) {
        const { data, error } = await supabase
          .from('resumes')
          .update({ title: resume.title, content: resume.content, is_base: resume.is_base })
          .eq('id', resume.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // If setting as base, unset other base resumes first
        if (resume.is_base) {
          await supabase
            .from('resumes')
            .update({ is_base: false })
            .eq('user_id', user.id)
            .eq('is_base', true);
        }
        const { data, error } = await supabase
          .from('resumes')
          .insert({ ...resume, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast({ title: 'Resume saved' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error saving resume', description: err.message, variant: 'destructive' });
    },
  });

  const deleteResume = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('resumes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast({ title: 'Resume deleted' });
    },
  });

  const tailoredResumesQuery = useQuery({
    queryKey: ['tailored-resumes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tailored_resumes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TailoredResume[];
    },
  });

  const saveTailoredResume = useMutation({
    mutationFn: async (tr: {
      base_resume_id?: string | null;
      job_description: string;
      tailored_content: string;
      score?: number | null;
      recommendations?: any[];
      job_title?: string;
      company_name?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tailored_resumes')
        .insert({ ...tr, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tailored-resumes'] });
      toast({ title: 'Tailored resume saved' });
    },
  });

  return {
    resumes: resumesQuery.data || [],
    baseResume,
    isLoading: resumesQuery.isLoading,
    saveResume,
    deleteResume,
    tailoredResumes: tailoredResumesQuery.data || [],
    saveTailoredResume,
  };
}

export async function callResumeAI(action: string, params: {
  resume?: string;
  jobDescription?: string;
  editInstruction?: string;
}) {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resume-ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ action, ...params }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'AI request failed');
  }

  const data = await response.json();
  return data.result;
}
