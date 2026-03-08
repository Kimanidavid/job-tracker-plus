
-- Create resumes table for storing base CVs
CREATE TABLE public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'My Resume',
  content text NOT NULL DEFAULT '',
  is_base boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resumes" ON public.resumes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own resumes" ON public.resumes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON public.resumes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resumes" ON public.resumes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create tailored_resumes table
CREATE TABLE public.tailored_resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  base_resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  job_description text NOT NULL DEFAULT '',
  tailored_content text NOT NULL DEFAULT '',
  score integer,
  recommendations jsonb DEFAULT '[]'::jsonb,
  job_title text,
  company_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tailored_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tailored resumes" ON public.tailored_resumes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tailored resumes" ON public.tailored_resumes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tailored resumes" ON public.tailored_resumes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tailored resumes" ON public.tailored_resumes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_tailored_resumes_updated_at BEFORE UPDATE ON public.tailored_resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
