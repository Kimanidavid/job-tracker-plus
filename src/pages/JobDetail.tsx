import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Building2, MapPin, Loader2, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTrackedJobs, type TrackedJob } from '@/hooks/useTrackedJobs';
import { useToast } from '@/hooks/use-toast';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { track, update, remove, tracked } = useTrackedJobs();
  const [job, setJob] = useState<TrackedJob | null>(null);
  const [loading, setLoading] = useState(true);

  const isExternal = location.pathname.includes('/jobs/external/');
  const incomingExternal = (location.state as any)?.job;

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (isExternal && incomingExternal) {
        // Build a transient job object from passed state
        setJob({
          id: '',
          external_id: incomingExternal.external_id,
          title: incomingExternal.title,
          company: incomingExternal.company,
          location: incomingExternal.location,
          url: incomingExternal.url,
          description: incomingExternal.description,
          posted_at: incomingExternal.posted_at,
          source: incomingExternal.source,
          keywords: null,
          score: null,
          status: 'saved',
          applied_at: null,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }
      if (id) {
        const { data, error } = await supabase
          .from('tracked_jobs')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) setJob(data as TrackedJob);
      }
      setLoading(false);
    })();
  }, [id, isExternal, incomingExternal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Job not found.</CardContent></Card>
      </div>
    );
  }

  const isPersisted = !!job.id;
  const existing = tracked.find(t => t.external_id === job.external_id);

  const handleApply = async () => {
    if (job.url) window.open(job.url, '_blank', 'noopener,noreferrer');
    if (isPersisted) {
      await update.mutateAsync({ id: job.id, status: 'applied', applied_at: new Date().toISOString() });
      toast({ title: 'Marked as applied' });
    } else {
      const saved = await track.mutateAsync({
        ...job,
        status: 'applied',
        applied_at: new Date().toISOString(),
      } as any);
      navigate(`/jobs/${saved.id}`, { replace: true });
    }
  };

  const handleSave = async () => {
    if (existing) {
      await remove.mutateAsync(existing.id);
      toast({ title: 'Removed from tracked' });
    } else {
      const saved = await track.mutateAsync({ ...job, status: 'saved' } as any);
      navigate(`/jobs/${saved.id}`, { replace: true });
      toast({ title: 'Saved' });
    }
  };

  const handleDelete = async () => {
    if (!isPersisted) return;
    await remove.mutateAsync(job.id);
    navigate('/autopilot');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="text-xl">{job.title}</CardTitle>
              <div className="flex items-center gap-3 mt-2 flex-wrap text-sm text-muted-foreground">
                {job.company && <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />{job.company}</span>}
                {job.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{job.location}</span>}
                <Badge variant={job.status === 'applied' ? 'default' : 'secondary'} className="text-[10px]">
                  {job.status}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button onClick={handleApply} className="gap-1.5">
                <ExternalLink className="w-4 h-4" /> Apply
              </Button>
              <Button variant="outline" onClick={handleSave} className="gap-1.5">
                {existing || isPersisted ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
                {existing || isPersisted ? 'Saved' : 'Save'}
              </Button>
              {isPersisted && (
                <Button variant="ghost" size="icon" onClick={handleDelete}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {job.description ? (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {job.description}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No description available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
