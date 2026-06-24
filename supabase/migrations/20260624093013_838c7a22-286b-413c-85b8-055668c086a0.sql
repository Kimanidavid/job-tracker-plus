
CREATE TABLE public.tracked_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  external_id text,
  title text NOT NULL,
  company text,
  location text,
  url text,
  description text,
  posted_at timestamptz,
  source text DEFAULT 'linkedin',
  keywords text,
  score integer,
  status text NOT NULL DEFAULT 'saved',
  applied_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracked_jobs TO authenticated;
GRANT ALL ON public.tracked_jobs TO service_role;

ALTER TABLE public.tracked_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tracked jobs" ON public.tracked_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own tracked jobs" ON public.tracked_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own tracked jobs" ON public.tracked_jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own tracked jobs" ON public.tracked_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_tracked_jobs_updated_at BEFORE UPDATE ON public.tracked_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
