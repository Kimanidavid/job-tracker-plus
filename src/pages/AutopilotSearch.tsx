import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Loader2, ExternalLink, Bookmark, BookmarkCheck, MapPin, Building2, Sparkles, Briefcase,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTrackedJobs } from '@/hooks/useTrackedJobs';

interface ApiJob {
  external_id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  posted_at: string | null;
  source: 'linkedin';
}

// Extract keywords from the most-recent base resume content
function extractRoleKeywords(text: string): string {
  if (!text) return '';
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  // try the second non-empty line (often a role tagline)
  const tagline = lines[1] || '';
  if (tagline && tagline.length < 80 && /[a-z]/i.test(tagline)) return tagline;
  // fallback: most common role-ish words
  const m = text.match(/\b(Senior|Lead|Staff|Principal)?\s?(Software|Frontend|Backend|Full[\s-]?Stack|Product|Data|ML|DevOps|Cloud|Mobile|iOS|Android)\s?(Engineer|Developer|Manager|Designer|Scientist|Analyst)\b/i);
  return m?.[0] ?? '';
}

const CACHE_KEY = 'autopilot:lastSearch';

export default function AutopilotSearch() {
  const cached = (() => {
    try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; }
  })();
  const [keywords, setKeywords] = useState<string>(cached?.keywords ?? '');
  const [location, setLocation] = useState<string>(cached?.location ?? '');
  const [postedWithinDays, setPostedWithinDays] = useState<number>(cached?.postedWithinDays ?? 4);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ApiJob[]>(cached?.results ?? []);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tracked, track, remove } = useTrackedJobs();
  const trackedByExt = useMemo(
    () => new Map(tracked.map(t => [t.external_id ?? '', t])),
    [tracked],
  );

  // Pre-fill keywords from the latest base resume (only if no cached search)
  useEffect(() => {
    if (cached?.keywords) return;
    (async () => {
      const { data } = await supabase
        .from('resumes')
        .select('content')
        .eq('is_base', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.content) {
        const kw = extractRoleKeywords(data.content);
        if (kw) setKeywords(kw);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist search state across navigation
  useEffect(() => {
    if (results.length === 0 && !keywords) return;
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ keywords, location, postedWithinDays, results }));
    } catch {}
  }, [keywords, location, postedWithinDays, results]);

  const runSearch = async () => {
    if (!keywords.trim()) {
      toast({ title: 'Add a role or keywords', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-jobs', {
        body: { keywords: keywords.trim(), location: location.trim(), rows: 25, postedWithinDays },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResults((data as any).jobs ?? []);
      toast({ title: `Found ${(data as any).jobs?.length ?? 0} roles` });
    } catch (err: any) {
      toast({ title: 'Search failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (job: ApiJob) => {
    // Track and open in new tab
    const existing = trackedByExt.get(job.external_id);
    let id = existing?.id;
    if (!existing) {
      try {
        const saved = await track.mutateAsync({
          external_id: job.external_id,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url,
          description: job.description,
          posted_at: job.posted_at,
          source: job.source,
          keywords,
          status: 'applied',
          applied_at: new Date().toISOString(),
        });
        id = saved.id;
      } catch (e: any) {
        toast({ title: 'Could not track job', description: e.message, variant: 'destructive' });
      }
    } else {
      await track.mutateAsync as any; // no-op; mutation already exists
    }
    if (job.url) window.open(job.url, '_blank', 'noopener,noreferrer');
  };

  const toggleTrack = async (job: ApiJob) => {
    const existing = trackedByExt.get(job.external_id);
    if (existing) {
      await remove.mutateAsync(existing.id);
      toast({ title: 'Removed from tracked' });
    } else {
      await track.mutateAsync({
        external_id: job.external_id,
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url,
        description: job.description,
        posted_at: job.posted_at,
        source: job.source,
        keywords,
        status: 'saved',
      });
      toast({ title: 'Saved to tracked jobs' });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Autopilot Search</h1>
        <p className="text-muted-foreground text-sm">
          We pull live LinkedIn roles via Apify based on your resume keywords. Apply opens the role and tracks it automatically.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr_180px_auto]">
            <Input
              placeholder="Role or keywords (e.g. Senior Frontend Engineer)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
            <Input
              placeholder="Location (e.g. London, Remote)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
            <Select value={String(postedWithinDays)} onValueChange={(v) => setPostedWithinDays(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Posted within" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Past 24 hours</SelectItem>
                <SelectItem value="2">Past 2 days</SelectItem>
                <SelectItem value="4">Past 4 days</SelectItem>
                <SelectItem value="7">Past week</SelectItem>
                <SelectItem value="14">Past 2 weeks</SelectItem>
                <SelectItem value="30">Past month</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={runSearch} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </Button>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Pre-filled from your latest base resume. Edit anytime.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="results">
        <TabsList>
          <TabsTrigger value="results">Results ({results.length})</TabsTrigger>
          <TabsTrigger value="tracked">Tracked ({tracked.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-3 mt-4">
          {loading && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Scraping LinkedIn…
            </div>
          )}
          {!loading && results.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No results yet. Hit <strong>Search</strong> to fetch roles.
              </CardContent>
            </Card>
          )}
          {results.map((job) => (
            <JobRow
              key={job.external_id}
              job={job}
              tracked={!!trackedByExt.get(job.external_id)}
              onApply={() => handleApply(job)}
              onToggleTrack={() => toggleTrack(job)}
              onOpen={() => navigate(`/jobs/external/${encodeURIComponent(job.external_id)}`, { state: { job } })}
            />
          ))}
        </TabsContent>

        <TabsContent value="tracked" className="space-y-3 mt-4">
          {tracked.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                You haven't tracked any roles yet.
              </CardContent>
            </Card>
          )}
          {tracked.map((j) => (
            <Card key={j.id} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => navigate(`/jobs/${j.id}`)}>
              <CardContent className="py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm truncate">{j.title}</h3>
                    <Badge variant={j.status === 'applied' ? 'default' : 'secondary'} className="text-[10px]">
                      {j.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                    {j.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{j.company}</span>}
                    {j.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location}</span>}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JobRow({
  job, tracked, onApply, onToggleTrack, onOpen,
}: {
  job: ApiJob; tracked: boolean;
  onApply: () => void; onToggleTrack: () => void; onOpen: () => void;
}) {
  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <button onClick={onOpen} className="text-left min-w-0 flex-1">
            <h3 className="font-semibold text-sm hover:text-primary transition-colors truncate">{job.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
              {job.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{job.company}</span>}
              {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
            </p>
            {job.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{job.description.slice(0, 220)}</p>
            )}
          </button>
          <div className="flex flex-col gap-2 shrink-0">
            <Button size="sm" onClick={onApply} className="gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Apply
            </Button>
            <Button size="sm" variant="outline" onClick={onToggleTrack} className="gap-1.5">
              {tracked ? <BookmarkCheck className="w-3.5 h-3.5 text-primary" /> : <Bookmark className="w-3.5 h-3.5" />}
              {tracked ? 'Tracked' : 'Track'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
