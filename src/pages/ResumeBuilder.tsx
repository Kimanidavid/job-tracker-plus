import { useState, useRef, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useResumes, callResumeAI, type Resume, type TailoredResume } from '@/hooks/useResumes';
import ResumePreview, { defaultThemes, parseResumeToSections, type ResumeSection, type ResumeTheme } from '@/components/ResumePreview';
import { resumeTemplates, templateToTheme, type ResumeTemplate } from '@/data/resumeTemplates';
import { exportToDocx, exportToPdf } from '@/utils/exportResume';
import {
  FileText, Upload, Wand2, Target, CheckCircle2,
  Sparkles, Save, Trash2, Copy, ArrowLeft, Loader2,
  AlertTriangle, Star, TrendingUp, BookOpen, FileUp,
  Download, Eye, Palette, GripVertical, LayoutTemplate,
  Send, MessageSquare, ChevronDown, Plus, Search, Pencil,
  PanelRightClose, PanelRightOpen, ZoomIn, ZoomOut,
  User, Briefcase, X, Bug, Mic, Undo2, Redo2,
} from 'lucide-react';

// ── AI structured format → ResumeSection[] ──
function convertAIFormatToSections(formatted: {
  person_name: string;
  tagline: string;
  contact_lines: string[];
  sidebar_sections: { title: string; content: string }[];
  main_sections: { title: string; content: string }[];
}): ResumeSection[] {
  const sections: ResumeSection[] = [];
  const headerContent = [formatted.person_name, formatted.tagline, ...formatted.contact_lines].join('\n');
  sections.push({ id: 'header', type: 'header', title: 'Contact Info', content: headerContent, visible: true });
  for (const s of formatted.sidebar_sections) {
    const t = s.title.toLowerCase();
    sections.push({
      id: crypto.randomUUID(),
      type: /education|academic|degree/.test(t) ? 'education' : 'skills',
      title: s.title,
      content: s.content,
      visible: true,
    });
  }
  for (const s of formatted.main_sections) {
    const t = s.title.toLowerCase();
    let type: ResumeSection['type'] = 'custom';
    if (/profile|summary|objective|about/.test(t)) type = 'summary';
    else if (/experience|work|employment/.test(t)) type = 'experience';
    sections.push({ id: crypto.randomUUID(), type, title: s.title, content: s.content, visible: true });
  }
  return sections;
}

type ViewMode = 'landing' | 'editor';
type EditorMode = 'base' | 'tailored';

export default function ResumeBuilder() {
  const { toast } = useToast();
  const {
    resumes, baseResume, isLoading, saveResume, deleteResume,
    tailoredResumes, saveTailoredResume,
  } = useResumes();

  // ── Top-level navigation state ──
  const [view, setView] = useState<ViewMode>('landing');
  const [editorMode, setEditorMode] = useState<EditorMode>('base');
  const [landingTab, setLandingTab] = useState<'all' | 'base' | 'tailored'>('all');
  const [search, setSearch] = useState('');
  const [pickBaseDialog, setPickBaseDialog] = useState(false);

  // ── Editor state ──
  const [resumeTitle, setResumeTitle] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tailoredContent, setTailoredContent] = useState('');
  const [editInstruction, setEditInstruction] = useState('');
  const [scoreData, setScoreData] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Editor UI state ──
  const [showAssistant, setShowAssistant] = useState(true);
  const [showLayoutStyle, setShowLayoutStyle] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(80);
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const [personalInfoOpen, setPersonalInfoOpen] = useState(true);

  // ── Create base resume dialog ──
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'upload' | 'scratch'>('upload');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newSetAsBase, setNewSetAsBase] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  // Personal info form (visual-only structured fields)
  const [piName, setPiName] = useState('');
  const [piRole, setPiRole] = useState('');
  const [piEmail, setPiEmail] = useState('');
  const [piPhone, setPiPhone] = useState('');
  const [piCity, setPiCity] = useState('');
  const [piLinkedIn, setPiLinkedIn] = useState('');

  // Preview / customization
  const [selectedTheme, setSelectedTheme] = useState<ResumeTheme>(defaultThemes[1]);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(resumeTemplates[0]);
  const [customColor, setCustomColor] = useState('');
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeContent = tailoredContent || resumeContent;
  const parsedSections = useMemo(() => parseResumeToSections(activeContent), [activeContent]);
  const liveSections = sections.length ? sections : parsedSections;

  // ── Derived: filtered resumes for landing ──
  const filteredBase = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return resumes;
    return resumes.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.content.toLowerCase().includes(q),
    );
  }, [resumes, search]);

  const filteredTailored = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tailoredResumes;
    return tailoredResumes.filter(r =>
      (r.job_title || '').toLowerCase().includes(q) ||
      (r.company_name || '').toLowerCase().includes(q) ||
      r.job_description.toLowerCase().includes(q),
    );
  }, [tailoredResumes, search]);

  // ── Editor: open / reset ──
  const openEditorBlank = () => {
    setResumeTitle('');
    setResumeContent('');
    setSections([]);
    setSelectedResumeId(null);
    setTailoredContent('');
    setJobDescription('');
    setEditorMode('base');
    setView('editor');
  };

  const openEditorWithBase = (r: Resume) => {
    setResumeTitle(r.title);
    setResumeContent(r.content);
    setSections([]);
    setSelectedResumeId(r.id);
    setTailoredContent('');
    setEditorMode('base');
    setView('editor');
  };

  const openEditorForTailoring = (r: Resume) => {
    setResumeTitle(r.title);
    setResumeContent(r.content);
    setSections([]);
    setSelectedResumeId(r.id);
    setTailoredContent('');
    setJobDescription('');
    setEditorMode('tailored');
    setView('editor');
  };

  const openEditorWithTailored = (t: TailoredResume) => {
    const base = resumes.find(r => r.id === t.base_resume_id);
    setResumeTitle(t.job_title ? `Tailored for ${t.job_title}` : 'Tailored resume');
    setResumeContent(base?.content || '');
    setTailoredContent(t.tailored_content);
    setJobDescription(t.job_description);
    setJobTitle(t.job_title || '');
    setCompanyName(t.company_name || '');
    setSelectedResumeId(t.base_resume_id);
    setSections([]);
    setEditorMode('tailored');
    setView('editor');
  };

  // ── Section helpers ──
  const toggleSectionVisibility = (id: string) =>
    setSections(prev => (prev.length ? prev : parsedSections).map(s => s.id === id ? { ...s, visible: !s.visible } : s));

  const moveSectionUp = (index: number) => {
    if (index <= 0) return;
    setSections(prev => {
      const base = prev.length ? prev : parsedSections;
      const next = [...base];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  // ── Export ──
  const handleExportDocx = async () => {
    setExportLoading(true);
    try {
      const theme = selectedTemplate ? templateToTheme(selectedTemplate) : selectedTheme;
      await exportToDocx(liveSections, theme, `${resumeTitle || 'resume'}.docx`, selectedTemplate);
      toast({ title: 'DOCX downloaded!' });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    } finally { setExportLoading(false); }
  };

  const handleExportPdf = async () => {
    setExportLoading(true);
    try {
      await exportToPdf('resume-preview', `${resumeTitle || 'resume'}.pdf`);
      toast({ title: 'PDF downloaded!' });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    } finally { setExportLoading(false); }
  };

  // ── Upload parsing ──
  const parseUploadedFile = async (file: File) => {
    setUploadLoading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + '\n\n';
        }
        return text.trim();
      } else if (ext === 'docx' || ext === 'doc') {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value.trim();
      } else if (ext === 'txt' || ext === 'md') {
        return await file.text();
      } else {
        throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      }
    } finally { setUploadLoading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max file size is 10MB', variant: 'destructive' });
      return;
    }
    try {
      const content = await parseUploadedFile(file);
      if (!content) {
        toast({ title: 'Could not extract text', description: 'The file appears to be empty or image-based.', variant: 'destructive' });
        return;
      }
      setResumeContent(content);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      if (!resumeTitle) setResumeTitle(nameWithoutExt);

      toast({ title: 'Formatting CV with AI...', description: 'Structuring your resume.' });
      setAiLoading(true);
      try {
        const formatted = await callResumeAI('format', { resume: content });
        if (formatted && formatted.person_name) {
          setSections(convertAIFormatToSections(formatted));
          // Sync personal info form
          setPiName(formatted.person_name || '');
          setPiRole(formatted.tagline || '');
          const contact = (formatted.contact_lines || []).join(' · ');
          const emailMatch = contact.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
          const phoneMatch = contact.match(/\+?\d[\d\s().-]{6,}/);
          if (emailMatch) setPiEmail(emailMatch[0]);
          if (phoneMatch) setPiPhone(phoneMatch[0]);
          toast({ title: 'CV formatted!' });
        } else {
          setSections(parseResumeToSections(content));
        }
      } catch (aiErr) {
        console.error('AI format failed:', aiErr);
        setSections(parseResumeToSections(content));
      } finally { setAiLoading(false); }
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
  };

  // ── Save / AI actions ──
  const handleSaveBase = () => {
    if (!resumeContent.trim()) {
      toast({ title: 'Resume content is empty', variant: 'destructive' });
      return;
    }
    saveResume.mutate({
      id: selectedResumeId || undefined,
      title: resumeTitle || 'My Resume',
      content: resumeContent,
      is_base: true,
    });
  };

  const handleTailor = async () => {
    if (!resumeContent.trim() || !jobDescription.trim()) {
      toast({ title: 'Need resume + job description', variant: 'destructive' });
      return;
    }
    setAiLoading(true);
    try {
      const result = await callResumeAI('tailor', { resume: resumeContent, jobDescription });
      setTailoredContent(result);
      setSections([]);
      toast({ title: 'Resume tailored!' });
    } catch (err: any) {
      toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
    } finally { setAiLoading(false); }
  };

  const handleScore = async () => {
    const contentToScore = tailoredContent || resumeContent;
    if (!contentToScore.trim()) {
      toast({ title: 'Need resume content', variant: 'destructive' });
      return;
    }
    if (!jobDescription.trim()) {
      toast({ title: 'Add a job description to score', variant: 'destructive' });
      return;
    }
    setAiLoading(true);
    try {
      const result = await callResumeAI('score', { resume: contentToScore, jobDescription });
      setScoreData(result);
      toast({ title: 'Analysis complete' });
    } catch (err: any) {
      toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
    } finally { setAiLoading(false); }
  };

  const handleSaveTailored = () => {
    if (!tailoredContent.trim()) return;
    saveTailoredResume.mutate({
      base_resume_id: selectedResumeId,
      job_description: jobDescription,
      tailored_content: tailoredContent,
      score: scoreData?.overall_score,
      recommendations: scoreData?.improvements || [],
      job_title: jobTitle,
      company_name: companyName,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    toast({ title: 'Copied to clipboard' });
  };

  // ── AI chat ──
  const handleChatSend = async (customMsg?: string) => {
    const msg = (customMsg || chatInput).trim();
    if (!msg || chatLoading) return;
    if (!customMsg) setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      if (liveSections.length === 0) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Please upload a CV first.' }]);
        setChatLoading(false);
        return;
      }
      const resumeText = liveSections.map(s =>
        s.type === 'header' ? s.content : `${s.title}\n${s.content}`
      ).join('\n\n');

      const enhancedInstruction = `You have full control to edit this CV. The user's request: "${msg}"

Guidelines:
- Make precise, targeted edits based on the request
- Preserve all other content that wasn't asked to be changed
- Keep formatting consistent (use bullet points with -)
- For adding sections, create them with appropriate titles
- For removing content, remove it completely
- For rewording, improve clarity while keeping meaning

Apply the requested changes and return the complete updated CV.`;

      const result = await callResumeAI('edit', { resume: resumeText, editInstruction: enhancedInstruction });
      if (result) {
        try {
          const formatted = await callResumeAI('format', { resume: result });
          if (formatted && formatted.person_name) {
            setSections(convertAIFormatToSections(formatted));
          } else {
            setSections(parseResumeToSections(result));
          }
          setChatMessages(prev => [...prev, { role: 'assistant', content: '✓ Done! CV updated.' }]);
        } catch {
          setSections(parseResumeToSections(result));
          setChatMessages(prev => [...prev, { role: 'assistant', content: '✓ Changes applied!' }]);
        }
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const suggestedActions = [
    {
      icon: Star,
      iconColor: 'text-amber-500',
      title: 'How does my resume compare to top candidates with my job title? What am I missing and how can I improve?',
      sub: 'Get a prioritized, actionable review',
      prompt: 'Compare my resume to top candidates in this field. What am I missing and how can I improve?',
    },
    {
      icon: Plus,
      iconColor: 'text-primary',
      title: 'Help me add a new experience to my resume',
      sub: 'Add work experience, projects, or achievements',
      prompt: 'Help me add a new work experience entry. Ask me what I did, where, and when.',
    },
    {
      icon: Pencil,
      iconColor: 'text-emerald-500',
      title: 'Help me improve an existing experience in my resume',
      sub: 'Enhance bullet points and descriptions',
      prompt: 'Improve the bullet points in my most recent role with stronger action verbs and quantified results.',
    },
    {
      icon: Target,
      iconColor: 'text-blue-500',
      title: "Highlight the top keywords I'm missing for ATS",
      sub: 'Boost ATS match by filling gaps',
      prompt: 'Identify the top keywords missing for ATS compatibility and add them naturally to my CV.',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  // ─────────────────────────────────────────────────────
  // LANDING VIEW
  // ─────────────────────────────────────────────────────
  if (view === 'landing') {
    const showBase = landingTab === 'all' || landingTab === 'base';
    const showTailored = landingTab === 'all' || landingTab === 'tailored';

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">AI Resume Builder</h1>
          <p className="text-muted-foreground">Manage your base resumes and job-tailored variations</p>
        </div>

        {/* Top action cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Base Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                A main resume targeted to a specific role/title and seniority. We suggest you create one or two of these at most, one for each role you are targeting.
              </p>
              <Button variant="outline" className="rounded-full bg-primary/5 border-primary/20 text-primary hover:bg-primary/10" onClick={openEditorBlank}>
                <Plus className="w-4 h-4 mr-1.5" />
                Create New
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Job Tailored Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                A resume targeted to a specific job description and built off of a Base Resume.
              </p>
              <Button
                variant="outline"
                className="rounded-full bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                onClick={() => {
                  if (resumes.length === 0) {
                    toast({ title: 'No base resume found', description: 'Create a Base Resume first.', variant: 'destructive' });
                    return;
                  }
                  setPickBaseDialog(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Select Base Resume
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={landingTab} onValueChange={(v) => setLandingTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="all" className="flex items-center gap-1.5 py-2.5">
              <LayoutTemplate className="w-3.5 h-3.5" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Resumes</span>
                <span className="text-[10px] text-muted-foreground font-normal">Base & tailored</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="base" className="flex items-center gap-1.5 py-2.5">
              <FileText className="w-3.5 h-3.5" />
              Base Resumes
            </TabsTrigger>
            <TabsTrigger value="tailored" className="flex items-center gap-1.5 py-2.5">
              <Briefcase className="w-3.5 h-3.5" />
              Tailored Resumes
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <p className="text-xs text-muted-foreground -mt-3">
          {landingTab === 'all' && 'Switch tabs to view only base or only job-tailored resumes.'}
          {landingTab === 'base' && 'Your reusable base resumes, one per role.'}
          {landingTab === 'tailored' && 'Resumes optimized for specific job descriptions.'}
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resumes by title, role, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>

        {/* Resume lists */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : (
          <div className={`grid gap-6 ${landingTab === 'all' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
            {showBase && (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-semibold text-lg">Base Resumes</h2>
                  <span className="text-xs text-muted-foreground">({filteredBase.length})</span>
                </div>
                {filteredBase.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                      No base resumes yet. Click <strong>Create New</strong> above to add one.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredBase.map(r => (
                      <BaseResumeCard
                        key={r.id}
                        resume={r}
                        onEdit={() => openEditorWithBase(r)}
                        onTailor={() => openEditorForTailoring(r)}
                        onDuplicate={() => {
                          saveResume.mutate({
                            title: `${r.title} (copy)`,
                            content: r.content,
                            is_base: false,
                          });
                        }}
                        onDelete={() => deleteResume.mutate(r.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {showTailored && (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-semibold text-lg">Job Tailored Resumes</h2>
                  <span className="text-xs text-muted-foreground">({filteredTailored.length})</span>
                </div>
                {filteredTailored.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                      No tailored resumes yet. Use <strong>Select Base Resume</strong> to start.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredTailored.map(t => {
                      const base = resumes.find(b => b.id === t.base_resume_id);
                      return (
                        <TailoredResumeCard
                          key={t.id}
                          tailored={t}
                          baseTitle={base?.title}
                          onEdit={() => openEditorWithTailored(t)}
                          onDuplicate={() => {
                            saveTailoredResume.mutate({
                              base_resume_id: t.base_resume_id,
                              job_description: t.job_description,
                              tailored_content: t.tailored_content,
                              score: t.score,
                              recommendations: (t.recommendations as any[]) || [],
                              job_title: `${t.job_title || 'Tailored'} (copy)`,
                              company_name: t.company_name || '',
                            });
                          }}
                          onDelete={() => {/* tailored delete not in hook; soft no-op */}}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pick base dialog */}
        {pickBaseDialog && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPickBaseDialog(false)}
          >
            <Card className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-lg">Select a Base Resume</CardTitle>
                <CardDescription>Pick which base resume to tailor for a new job.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                {resumes.map(r => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setPickBaseDialog(false);
                      openEditorForTailoring(r);
                    }}
                    className="w-full text-left p-3 rounded-md border hover:bg-accent/50 hover:border-primary/40 transition-colors"
                  >
                    <p className="font-medium text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────
  // EDITOR VIEW
  // ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/20">
      {/* Top bar */}
      <header className="grid grid-cols-3 items-center gap-2 px-4 py-2 border-b bg-card shrink-0">
        {/* Left segment */}
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('landing')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Input
            value={resumeTitle}
            onChange={(e) => setResumeTitle(e.target.value)}
            placeholder="Untitled resume"
            className="h-8 text-sm font-semibold border-transparent hover:border-input focus:border-input bg-transparent max-w-[260px]"
          />
          <Pencil className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full text-xs"
              onClick={() => setShowAssistant(v => !v)}
            >
              {showAssistant ? <PanelRightClose className="w-3.5 h-3.5 mr-1.5" /> : <PanelRightOpen className="w-3.5 h-3.5 mr-1.5" />}
              {showAssistant ? 'Hide Assistant' : 'Show Assistant'}
            </Button>
          </div>
        </div>

        {/* Center segment */}
        <div className="flex items-center gap-2 justify-center">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setChatMessages([])}>
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            <Bug className="w-3.5 h-3.5 mr-1" /> Report Bug
          </Button>
          <Badge variant="outline" className="h-7 rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Tokens left: {chatTokens}
          </Badge>
          <Button variant="destructive" size="sm" className="h-8 text-xs ml-2" onClick={() => setShowAssistant(false)}>
            Close Chat
          </Button>
        </div>

        {/* Right segment */}
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant={showTemplates ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setShowTemplates(v => !v); setShowLayoutStyle(false); }}
          >
            <LayoutTemplate className="w-3.5 h-3.5 mr-1" /> Templates
          </Button>
          <Button
            variant={showLayoutStyle ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setShowLayoutStyle(v => !v); setShowTemplates(false); }}
          >
            <Palette className="w-3.5 h-3.5 mr-1" /> Layout & Style
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90" onClick={handleExportPdf} disabled={exportLoading}>
            {exportLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
            Download PDF
          </Button>
        </div>
      </header>

      {/* Body — 3 columns */}
      <div className={`grid flex-1 min-h-0 ${showAssistant ? 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]' : 'grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]'}`}>
        {/* LEFT COLUMN — Analysis + Personal Info */}
        <ScrollArea className="h-full border-r bg-card">
          <div className="p-4 space-y-4">
            {/* Resume Analysis */}
            <Collapsible open={analysisOpen} onOpenChange={setAnalysisOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" /> Resume Analysis
                      </CardTitle>
                      <ChevronDown className={`w-4 h-4 transition-transform ${analysisOpen ? '' : '-rotate-90'}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                      Analyze your resume to get insights on its strengths and areas for improvement. This step is recommended before matching your resume to job descriptions.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        className="h-auto py-2.5 flex flex-col items-start text-left bg-gradient-to-br from-primary to-primary/80 hover:opacity-95"
                        onClick={handleScore}
                        disabled={aiLoading}
                      >
                        <div className="flex items-center gap-1.5 w-full">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">Analyze Resume</span>
                          <ArrowLeft className="w-3 h-3 ml-auto rotate-180" />
                        </div>
                        <span className="text-[10px] opacity-90 mt-0.5">Get detailed insights</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-auto py-2.5 flex flex-col items-start text-left"
                        onClick={() => setEditorMode('tailored')}
                      >
                        <div className="flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">Tailor to Specific Job</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Match job requirements</span>
                      </Button>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <p className="font-semibold mb-1">Recommended workflow</p>
                        <p className="leading-relaxed">For optimal results, start by analyzing your resume to understand its current strengths before tailoring it to specific job opportunities.</p>
                      </div>
                    </div>

                    {scoreData && (
                      <div className="space-y-2 p-3 rounded-md border bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">Overall Score</span>
                          <span className={`text-lg font-bold ${
                            scoreData.overall_score >= 80 ? 'text-emerald-600' :
                            scoreData.overall_score >= 60 ? 'text-amber-600' : 'text-destructive'
                          }`}>{scoreData.overall_score}/100</span>
                        </div>
                        <Progress value={scoreData.overall_score} className="h-2" />
                        {scoreData.improvements?.slice(0, 2).map((imp: any, i: number) => (
                          <div key={i} className="text-[10px] text-muted-foreground">
                            <Badge variant={getPriorityColor(imp.priority) as any} className="text-[9px] mr-1.5">{imp.priority}</Badge>
                            {imp.suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Tailored mode: job description */}
            {editorMode === 'tailored' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" /> Job Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    placeholder="Job title"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Input
                    placeholder="Company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Textarea
                    placeholder="Paste the full job description..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="text-xs min-h-[120px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleTailor} disabled={aiLoading}>
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
                      Tailor
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSaveTailored} disabled={!tailoredContent.trim()}>
                      <Save className="w-3.5 h-3.5 mr-1" /> Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personal Information */}
            <Collapsible open={personalInfoOpen} onOpenChange={setPersonalInfoOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" /> Personal Information
                      </CardTitle>
                      <ChevronDown className={`w-4 h-4 transition-transform ${personalInfoOpen ? '' : '-rotate-90'}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-3">
                    <div className="rounded-md border bg-muted/30">
                      <button className="w-full flex items-center justify-between p-2 text-xs">
                        <span>Tips and Recommendations</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Name</Label>
                        <Input value={piName} onChange={(e) => setPiName(e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Job Title</Label>
                        <Input value={piRole} onChange={(e) => setPiRole(e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Email</Label>
                        <Input value={piEmail} onChange={(e) => setPiEmail(e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Phone</Label>
                        <Input value={piPhone} onChange={(e) => setPiPhone(e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">City</Label>
                        <Input value={piCity} onChange={(e) => setPiCity(e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">LinkedIn</Label>
                        <Input value={piLinkedIn} onChange={(e) => setPiLinkedIn(e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Upload / paste */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-primary" /> Resume Source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) await handleFileUpload({ target: { files: [file] } } as any);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  {uploadLoading ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <p className="text-xs">Parsing CV...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <FileUp className="w-5 h-5 text-muted-foreground" />
                      <p className="text-xs font-medium">Drop CV or click to upload</p>
                      <p className="text-[10px] text-muted-foreground">PDF, DOCX, TXT (max 10MB)</p>
                    </div>
                  )}
                </div>
                <Textarea
                  placeholder="Or paste resume content..."
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                  className="min-h-[100px] text-xs font-mono"
                />
                <Button size="sm" className="w-full h-8 text-xs" onClick={handleSaveBase} disabled={saveResume.isPending || !resumeContent.trim()}>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {selectedResumeId ? 'Update Base Resume' : 'Save as Base Resume'}
                </Button>
              </CardContent>
            </Card>

            {/* Templates / Layout & Style panels — appear when toggled */}
            {showTemplates && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-primary" /> Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {resumeTemplates.map(t => {
                    const active = selectedTemplate?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setSelectedTemplate(t); setSelectedTheme(templateToTheme(t)); setCustomColor(''); }}
                        className={`w-full flex items-center gap-2 p-2 rounded-md border text-left text-xs ${active ? 'border-primary bg-primary/10 font-semibold' : 'border-border hover:border-primary/40'}`}
                      >
                        <div className="w-5 h-5 rounded-full shrink-0" style={{ background: `linear-gradient(135deg, ${t.palette.navy}, ${t.palette.accent})` }} />
                        {t.name}
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {showLayoutStyle && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" /> Layout & Style
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Accent Color</Label>
                    <div className="flex gap-2 items-center mt-1.5">
                      <input
                        type="color"
                        value={customColor || selectedTemplate?.palette.accent || '#2E7DD1'}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />
                      {customColor && (
                        <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={() => setCustomColor('')}>Reset</Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-muted-foreground">Sections</Label>
                    {liveSections.map((section, idx) => (
                      <div key={section.id} className="flex items-center gap-1.5 p-1.5 rounded-md border bg-card">
                        <button onClick={() => moveSectionUp(idx)} className="text-muted-foreground hover:text-foreground">
                          <GripVertical className="w-3 h-3" />
                        </button>
                        <span className="flex-1 text-[11px] truncate">{section.title}</span>
                        <Switch checked={section.visible} onCheckedChange={() => toggleSectionVisibility(section.id)} />
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={handleExportDocx} disabled={exportLoading}>
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export DOCX
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* CENTER COLUMN — AI Chat Assistant */}
        {showAssistant && (
          <div className="flex flex-col h-full border-r bg-card overflow-hidden">
            {/* Welcome bubble */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 bg-primary/5 rounded-lg p-3 text-xs">
                    <p className="font-semibold mb-1">JobSuit AI · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-muted-foreground leading-relaxed">
                      Hi there! I can help you improve your resume. Ask me for feedback, or improvements for specific sections — I can directly edit your resume.
                    </p>
                  </div>
                </div>

                {/* Suggested actions */}
                {chatMessages.length === 0 && (
                  <div className="space-y-2">
                    {suggestedActions.map((a, i) => {
                      const Icon = a.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => handleChatSend(a.prompt)}
                          disabled={chatLoading}
                          className="w-full text-left p-3 rounded-lg border bg-background hover:bg-accent/40 hover:border-primary/40 transition-colors flex items-start gap-2.5 disabled:opacity-50"
                        >
                          <div className={`w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 ${a.iconColor}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium leading-snug">{a.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{a.sub}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Chat history */}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-xs p-2.5 rounded-lg max-w-[90%] ${msg.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    {msg.content}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground p-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Editing your CV...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            {/* Chat input */}
            <div className="border-t p-3 space-y-2">
              <div className="flex items-end gap-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                  placeholder="Message..."
                  className="text-xs min-h-[40px] max-h-[120px] resize-none"
                  disabled={chatLoading}
                />
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button size="sm" className="h-9 px-4" onClick={() => handleChatSend()} disabled={chatLoading || !chatInput.trim()}>
                  Send
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Messages are processed by AI. Verify important information. Chat tokens left: {chatTokens}
              </p>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN — Live Preview */}
        <div className="flex flex-col h-full overflow-hidden bg-muted/40">
          {/* Zoom toolbar */}
          <div className="flex items-center justify-end gap-1 px-3 py-2 border-b bg-card">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewZoom(z => Math.max(40, z - 10))}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs font-medium w-12 text-center">{previewZoom}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewZoom(z => Math.min(150, z + 10))}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 flex justify-center">
              {liveSections.length > 0 ? (
                <div style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}>
                  <ResumePreview
                    ref={previewRef}
                    sections={liveSections}
                    theme={selectedTheme}
                    customColor={customColor || undefined}
                    template={selectedTemplate}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                  <Eye className="w-8 h-8 mb-3 opacity-50" />
                  <p className="text-sm">Upload a CV or paste content to see preview.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Card components
// ─────────────────────────────────────────────────────
function ResumeThumbnail() {
  return (
    <div className="aspect-[3/4] w-[120px] shrink-0 rounded-md border bg-white overflow-hidden p-2">
      <div className="w-full h-full flex flex-col gap-0.5">
        <div className="h-2 w-3/4 bg-foreground/80 rounded-sm mx-auto mb-1" />
        <div className="h-px bg-border" />
        <div className="space-y-0.5 mt-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="h-px bg-foreground/30 rounded-full" style={{ width: `${60 + ((i * 13) % 35)}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BaseResumeCard({
  resume, onEdit, onTailor, onDuplicate, onDelete,
}: {
  resume: Resume;
  onEdit: () => void;
  onTailor: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex gap-4">
        <ResumeThumbnail />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 space-y-1.5">
            <p className="text-xs">
              <span className="text-muted-foreground">Resume Title: </span>
              <span className="font-semibold text-primary">{resume.title}</span>
            </p>
            <p className="text-xs">
              <span className="text-muted-foreground">Job Title: </span>
              <span className="font-medium">{resume.title.split(/\s+/).slice(0, 3).join(' ') || '—'}</span>
            </p>
          </div>
          <div className="space-y-1.5 mt-3">
            <Button variant="outline" size="sm" className="w-full h-8 rounded-full text-xs bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" onClick={onEdit}>
              <Pencil className="w-3 h-3 mr-1.5" /> Edit Resume
            </Button>
            <Button variant="outline" size="sm" className="w-full h-8 rounded-full text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" onClick={onTailor}>
              <Plus className="w-3 h-3 mr-1.5" /> Tailor to Job
            </Button>
            <Button variant="outline" size="sm" className="w-full h-8 rounded-full text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" onClick={onDuplicate}>
              <Copy className="w-3 h-3 mr-1.5" /> Duplicate
            </Button>
            <Button variant="outline" size="sm" className="w-full h-8 rounded-full text-xs bg-red-50 text-red-700 border-red-200 hover:bg-red-100" onClick={onDelete}>
              <Trash2 className="w-3 h-3 mr-1.5" /> Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TailoredResumeCard({
  tailored, baseTitle, onEdit, onDuplicate, onDelete,
}: {
  tailored: TailoredResume;
  baseTitle?: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex gap-4">
        <ResumeThumbnail />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 space-y-1.5">
            <p className="text-xs">
              <span className="text-muted-foreground">Resume Title: </span>
              <span className="font-semibold text-primary">Tailored for {tailored.job_title || 'role'}</span>
            </p>
            <p className="text-xs">
              <span className="text-muted-foreground">Job Title: </span>
              <span className="font-medium">{tailored.job_title || '—'}</span>
            </p>
            <p className="text-xs">
              <span className="text-muted-foreground">Company: </span>
              <span className="font-medium">{tailored.company_name || 'Not specified'}</span>
            </p>
            {baseTitle && (
              <p className="text-xs">
                <span className="text-muted-foreground">Used Base Resume: </span>
                <span className="font-medium">{baseTitle}</span>
              </p>
            )}
          </div>
          <div className="space-y-1.5 mt-3">
            <Button variant="outline" size="sm" className="w-full h-8 rounded-full text-xs bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" onClick={onEdit}>
              <Pencil className="w-3 h-3 mr-1.5" /> Edit Resume
            </Button>
            <Button variant="outline" size="sm" className="w-full h-8 rounded-full text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" onClick={onDuplicate}>
              <Copy className="w-3 h-3 mr-1.5" /> Duplicate
            </Button>
            <Button variant="outline" size="sm" className="w-full h-8 rounded-full text-xs bg-red-50 text-red-700 border-red-200 hover:bg-red-100" onClick={onDelete}>
              <Trash2 className="w-3 h-3 mr-1.5" /> Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
