import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TrackedJob {
  id: string;
  external_id: string | null;
  title: string;
  company: string | null;
  location: string | null;
  url: string | null;
  description: string | null;
  posted_at: string | null;
  source: string | null;
  keywords: string | null;
  score: number | null;
  status: string;
  applied_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useTrackedJobs() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const list = useQuery({
    queryKey: ['tracked_jobs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracked_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TrackedJob[];
    },
  });

  const track = useMutation({
    mutationFn: async (job: Partial<TrackedJob> & { title: string }) => {
      if (!user) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('tracked_jobs')
        .insert({ ...job, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as TrackedJob;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracked_jobs'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<TrackedJob> & { id: string }) => {
      const { data, error } = await supabase
        .from('tracked_jobs')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as TrackedJob;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracked_jobs'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tracked_jobs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracked_jobs'] }),
  });

  return { tracked: list.data ?? [], isLoading: list.isLoading, track, update, remove };
}
