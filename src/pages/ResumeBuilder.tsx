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
import { useToast } from '@/hooks/use-toast';
import { useResumes, callResumeAI } from '@/hooks/useResumes';
import ResumePreview, { defaultThemes, parseResumeToSections, type ResumeSection, type ResumeTheme } from '@/components/ResumePreview';
import { exportToDocx, exportToPdf } from '@/utils/exportResume';
import {
  FileText, Upload, Wand2, Target, CheckCircle2,
  Sparkles, Save, Trash2, Copy, ArrowRight, Loader2,
  AlertTriangle, Star, TrendingUp, BookOpen, FileUp,
  Download, Eye, Palette, GripVertical, LayoutTemplate,
  Send, MessageSquare
} from 'lucide-react';

// Convert AI-structured format result into ResumeSection[]
function convertAIFormatToSections(formatted: {
  person_name: string;
  tagline: string;
  contact_lines: string[];
  sidebar_sections: { title: string; content: string }[];
  main_sections: { title: string; content: string }[];
}): ResumeSection[] {
  const sections: ResumeSection[] = [];

  // Header section: name + tagline + contact
  const headerContent = [
    formatted.person_name,
    formatted.tagline,
    ...formatted.contact_lines,
  ].join('\n');
  sections.push({
    id: 'header',
    type: 'header',
    title: 'Contact Info',
    content: headerContent,
    visible: true,
  });

  // Sidebar sections → mapped to 'skills' or 'education' type
  for (const s of formatted.sidebar_sections) {
    const titleLower = s.title.toLowerCase();
    let type: ResumeSection['type'] = 'skills';
    if (/education|academic|degree/.test(titleLower)) type = 'education';
    sections.push({
      id: crypto.randomUUID(),
      type,
      title: s.title,
      content: s.content,
      visible: true,
    });
  }

  // Main sections → mapped to appropriate types
  for (const s of formatted.main_sections) {
    const titleLower = s.title.toLowerCase();
    let type: ResumeSection['type'] = 'custom';
    if (/profile|summary|objective|about/.test(titleLower)) type = 'summary';
    else if (/experience|work|employment/.test(titleLower)) type = 'experience';
    sections.push({
      id: crypto.randomUUID(),
      type,
      title: s.title,
      content: s.content,
      visible: true,
    });
  }

  return sections;
}

export default function ResumeBuilder() {
  const { toast } = useToast();
  const {
    resumes, baseResume, isLoading, saveResume, deleteResume,
    tailoredResumes, saveTailoredResume
  } = useResumes();

  const [activeTab, setActiveTab] = useState('base');
  const [resumeTitle, setResumeTitle] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tailoredContent, setTailoredContent] = useState('');
  const [editInstruction, setEditInstruction] = useState('');
  const [scoreData, setScoreData] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Preview / customization state
  const [selectedTheme, setSelectedTheme] = useState<ResumeTheme>(defaultThemes[1]);
  const [customColor, setCustomColor] = useState('');
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Chat state for real-time AI edits
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeContent = tailoredContent || resumeContent;

  // Parse sections whenever we enter preview tab
  const parsedSections = useMemo(() => parseResumeToSections(activeContent), [activeContent]);

  const handleOpenPreview = () => {
    if (!activeContent.trim()) {
      toast({ title: 'No resume content to preview', variant: 'destructive' });
      return;
    }
    setSections(parseResumeToSections(activeContent));
    setActiveTab('preview');
  };

  const toggleSectionVisibility = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  };

  const moveSectionUp = (index: number) => {
    if (index <= 0) return;
    setSections(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleExportDocx = async () => {
    setExportLoading(true);
    try {
      await exportToDocx(sections.length ? sections : parsedSections, selectedTheme, `${resumeTitle || 'resume'}.docx`);
      toast({ title: 'DOCX downloaded!' });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setExportLoading(true);
    try {
      await exportToPdf('resume-preview', `${resumeTitle || 'resume'}.pdf`);
      toast({ title: 'PDF downloaded!' });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    } finally {
      setExportLoading(false);
    }
  };

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
    } finally {
      setUploadLoading(false);
    }
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

      // Use AI to intelligently structure the CV into sidebar/main sections
      toast({ title: 'Formatting CV with AI...', description: 'Structuring your resume into the template layout.' });
      setAiLoading(true);
      try {
        const formatted = await callResumeAI('format', { resume: content });
        if (formatted && formatted.person_name) {
          const aiSections = convertAIFormatToSections(formatted);
          setSections(aiSections);
          setActiveTab('preview');
          toast({ title: 'CV formatted!', description: 'Your CV has been structured into the two-column template.' });
        } else {
          // Fallback to basic parsing
          setSections(parseResumeToSections(content));
          setActiveTab('preview');
          toast({ title: 'CV uploaded', description: 'Using basic formatting. AI formatting was unavailable.' });
        }
      } catch (aiErr) {
        console.error('AI format failed, using basic parse:', aiErr);
        setSections(parseResumeToSections(content));
        setActiveTab('preview');
        toast({ title: 'CV uploaded', description: 'Using basic formatting (AI unavailable).' });
      } finally {
        setAiLoading(false);
      }
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
  };

  const loadBaseResume = () => {
    if (baseResume) {
      setResumeContent(baseResume.content);
      setResumeTitle(baseResume.title);
      setSelectedResumeId(baseResume.id);
      toast({ title: 'Base resume loaded' });
    }
  };

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
      toast({ title: 'Please provide both resume and job description', variant: 'destructive' });
      return;
    }
    setAiLoading(true);
    try {
      const result = await callResumeAI('tailor', { resume: resumeContent, jobDescription });
      setTailoredContent(result);
      setActiveTab('result');
      toast({ title: 'Resume tailored successfully!' });
    } catch (err: any) {
      toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleScore = async () => {
    const contentToScore = tailoredContent || resumeContent;
    if (!contentToScore.trim() || !jobDescription.trim()) {
      toast({ title: 'Need resume and job description to score', variant: 'destructive' });
      return;
    }
    setAiLoading(true);
    try {
      const result = await callResumeAI('score', { resume: contentToScore, jobDescription });
      setScoreData(result);
      setActiveTab('score');
    } catch (err: any) {
      toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleFix = async () => {
    if (!resumeContent.trim()) {
      toast({ title: 'No resume content to fix', variant: 'destructive' });
      return;
    }
    setAiLoading(true);
    try {
      const result = await callResumeAI('fix', { resume: resumeContent });
      setTailoredContent(result);
      setActiveTab('result');
      toast({ title: 'Resume improved!' });
    } catch (err: any) {
      toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleEdit = async () => {
    const content = tailoredContent || resumeContent;
    if (!content.trim() || !editInstruction.trim()) {
      toast({ title: 'Need resume and edit instruction', variant: 'destructive' });
      return;
    }
    setAiLoading(true);
    try {
      const result = await callResumeAI('edit', { resume: content, editInstruction });
      setTailoredContent(result);
      setEditInstruction('');
      toast({ title: 'Edit applied!' });
    } catch (err: any) {
      toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveTailored = () => {
    if (!tailoredContent.trim()) return;
    saveTailoredResume.mutate({
      base_resume_id: selectedResumeId,
      job_description: jobDescription,
      tailored_content: tailoredContent,
      score: scoreData?.overall_score,
      recommendations: scoreData?.improvements || [],
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    toast({ title: 'Copied to clipboard' });
  };

  // Chat-based AI CV editing with full control
  const handleChatSend = async (customMsg?: string) => {
    const msg = (customMsg || chatInput).trim();
    if (!msg || chatLoading) return;
    if (!customMsg) setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      // Build current resume text from sections
      const currentSections = sections.length ? sections : parsedSections;
      if (currentSections.length === 0) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Please upload a CV first before I can edit it.' }]);
        setChatLoading(false);
        return;
      }
      
      const resumeText = currentSections.map(s => {
        if (s.type === 'header') return s.content;
        return `${s.title}\n${s.content}`;
      }).join('\n\n');

      // Enhanced edit instruction with context
      const enhancedInstruction = `You have full control to edit this CV. The user's request: "${msg}"

Guidelines:
- Make precise, targeted edits based on the request
- Preserve all other content that wasn't asked to be changed
- Keep formatting consistent (use bullet points with -)
- For adding sections, create them with appropriate titles
- For removing content, remove it completely
- For rewording, improve clarity while keeping meaning
- If asked to add keywords, integrate them naturally into relevant sections

Apply the requested changes and return the complete updated CV.`;

      const result = await callResumeAI('edit', { resume: resumeText, editInstruction: enhancedInstruction });
      if (result) {
        // Re-format through AI to structure properly
        try {
          const formatted = await callResumeAI('format', { resume: result });
          if (formatted && formatted.person_name) {
            const aiSections = convertAIFormatToSections(formatted);
            setSections(aiSections);
            setChatMessages(prev => [...prev, { role: 'assistant', content: '✓ Done! Your CV has been updated. Check the preview.' }]);
          } else {
            setSections(parseResumeToSections(result));
            setChatMessages(prev => [...prev, { role: 'assistant', content: '✓ Changes applied! (Basic formatting used)' }]);
          }
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

  const quickEditActions = [
    { label: 'Shorten', prompt: 'Make all descriptions more concise and shorter' },
    { label: 'Add Keywords', prompt: 'Add more relevant technical keywords throughout' },
    { label: 'Improve Bullets', prompt: 'Rewrite bullet points with stronger action verbs and quantified results' },
    { label: 'Fix Grammar', prompt: 'Fix any grammar or spelling issues' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Resume Builder</h1>
          <p className="text-muted-foreground">Paste your resume, add a job description, and let AI optimize it</p>
        </div>
        {aiLoading && (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">AI is working...</span>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="base" className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Base Resume</span>
            <span className="sm:hidden">Base</span>
          </TabsTrigger>
          <TabsTrigger value="tailor" className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tailor</span>
            <span className="sm:hidden">Tailor</span>
          </TabsTrigger>
          <TabsTrigger value="result" className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Result</span>
            <span className="sm:hidden">Result</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview & Export</span>
            <span className="sm:hidden">Preview</span>
          </TabsTrigger>
          <TabsTrigger value="score" className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Score</span>
            <span className="sm:hidden">Score</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
            <span className="sm:hidden">History</span>
          </TabsTrigger>
        </TabsList>

        {/* BASE RESUME TAB */}
        <TabsContent value="base" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Your Base Resume</CardTitle>
                <CardDescription>
                  Upload a CV file or paste your resume content. This will be stored and reused when tailoring for new jobs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Zone */}
                <div
                  className="relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const fakeEvent = { target: { files: [file] } } as any;
                      await handleFileUpload(fakeEvent);
                    }
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
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm font-medium">Parsing your CV...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileUp className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Drop your CV here or click to upload</p>
                      <p className="text-xs text-muted-foreground">Supports PDF, DOCX, DOC, TXT (max 10MB)</p>
                    </div>
                  )}
                </div>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 border-t" />
                  <span className="text-xs text-muted-foreground">or load a sample CV</span>
                  <div className="flex-1 border-t" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sampleResumes.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => {
                        setResumeContent(sample.content);
                        setResumeTitle(sample.title);
                        toast({ title: 'Sample loaded', description: sample.title });
                      }}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/30 transition-colors text-left"
                    >
                      <UserCircle className="w-8 h-8 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{sample.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{sample.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 border-t" />
                  <span className="text-xs text-muted-foreground">or paste manually</span>
                  <div className="flex-1 border-t" />
                </div>

                <div className="space-y-2">
                  <Label>Resume Title</Label>
                  <Input
                    placeholder="e.g. Software Engineer Resume"
                    value={resumeTitle}
                    onChange={(e) => setResumeTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resume Content</Label>
                  <Textarea
                    placeholder="Paste your full resume here..."
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleSaveBase} disabled={saveResume.isPending}>
                    <Save className="w-4 h-4 mr-1" />
                    {baseResume ? 'Update Base Resume' : 'Save as Base Resume'}
                  </Button>
                  <Button variant="secondary" onClick={handleFix} disabled={aiLoading || !resumeContent.trim()}>
                    <Wand2 className="w-4 h-4 mr-1" />
                    AI Fix & Improve
                  </Button>
                  <Button variant="outline" onClick={handleOpenPreview} disabled={!resumeContent.trim()}>
                    <Eye className="w-4 h-4 mr-1" />
                    Preview & Export
                  </Button>
                  <Button variant="outline" onClick={handleCopy} disabled={!resumeContent.trim()}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Saved Resumes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </div>
                  ) : resumes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No saved resumes yet. Paste your resume and save it.</p>
                  ) : (
                    <div className="space-y-2">
                      {resumes.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                          <button
                            className="flex-1 text-left"
                            onClick={() => {
                              setResumeContent(r.content);
                              setResumeTitle(r.title);
                              setSelectedResumeId(r.id);
                            }}
                          >
                            <p className="text-sm font-medium truncate">{r.title}</p>
                            <div className="flex items-center gap-1.5">
                              {r.is_base && <Badge variant="secondary" className="text-xs">Base</Badge>}
                              <span className="text-xs text-muted-foreground">
                                {new Date(r.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => deleteResume.mutate(r.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {baseResume && (
                    <Button variant="outline" className="w-full justify-start" onClick={loadBaseResume}>
                      <Upload className="w-4 h-4 mr-2" />
                      Load Base Resume
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      if (resumeContent.trim()) setActiveTab('tailor');
                      else toast({ title: 'Add resume content first', variant: 'destructive' });
                    }}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Go to Tailoring
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAILOR TAB */}
        <TabsContent value="tailor" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Resume</CardTitle>
                <CardDescription>
                  {resumeContent.trim() ? 'Resume loaded. Edit below or load your base resume.' : 'Paste or load your resume first.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Your resume content..."
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                  className="min-h-[350px] font-mono text-sm"
                />
                {baseResume && !resumeContent.trim() && (
                  <Button variant="secondary" size="sm" onClick={loadBaseResume}>
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    Load Base Resume
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Description</CardTitle>
                <CardDescription>Paste the job description you're applying for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Paste the full job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[350px] text-sm"
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleTailor} disabled={aiLoading} size="lg">
              {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Target className="w-4 h-4 mr-2" />}
              Tailor Resume
            </Button>
            <Button variant="secondary" onClick={handleScore} disabled={aiLoading} size="lg">
              {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              Score Resume
            </Button>
          </div>
        </TabsContent>

        {/* RESULT TAB */}
        <TabsContent value="result" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Tailored Resume</CardTitle>
                  <CardDescription>AI-optimized for the target job. Edit directly or use AI edit below.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleOpenPreview} disabled={!tailoredContent.trim()}>
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </Button>
                  <Button size="sm" onClick={handleSaveTailored} disabled={!tailoredContent.trim()}>
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tailoredContent ? (
                <Textarea
                  value={tailoredContent}
                  onChange={(e) => setTailoredContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <Sparkles className="w-8 h-8 mb-3 opacity-50" />
                  <p>No tailored resume yet. Go to the Tailor tab to generate one.</p>
                </div>
              )}

              {tailoredContent && (
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label>AI Edit Instruction</Label>
                    <Input
                      placeholder="e.g. Make the summary more concise, add more Python keywords..."
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                    />
                  </div>
                  <Button onClick={handleEdit} disabled={aiLoading || !editInstruction.trim()}>
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  </Button>
                </div>
              )}

              {tailoredContent && (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleScore} disabled={aiLoading}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Score This Resume
                  </Button>
                  <Button variant="outline" onClick={handleFix} disabled={aiLoading}>
                    <Wand2 className="w-4 h-4 mr-1" />
                    Further Improve
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREVIEW & EXPORT TAB */}
        <TabsContent value="preview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[240px_1fr_320px]">
            {/* Left sidebar — Color themes + Sections + Export */}
            <div className="space-y-3">
              {/* Color theme buttons */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Color Theme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 mb-3">
                    {resumeTemplates.map(t => {
                      const isActive = selectedTemplate?.id === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedTemplate(t);
                            setSelectedTheme(templateToTheme(t));
                            setCustomColor('');
                          }}
                          className={`w-full flex items-center gap-2 p-2 rounded-md border text-left transition-all text-xs ${
                            isActive ? 'border-primary bg-primary/10 font-semibold' : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-full shrink-0"
                            style={{ background: `linear-gradient(135deg, ${t.palette.navy}, ${t.palette.accent})` }}
                          />
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                  {selectedTemplate && (
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={customColor || selectedTemplate.palette.accent}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0"
                      />
                      <span className="text-[10px] text-muted-foreground">{selectedTemplate.name}</span>
                      {customColor && (
                        <Button variant="ghost" size="sm" onClick={() => setCustomColor('')} className="text-[10px] h-5 px-1">
                          Reset
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-1">
                      {(sections.length ? sections : parsedSections).map((section, idx) => (
                        <div key={section.id} className="flex items-center gap-1.5 p-1 rounded-md border bg-card">
                          <button onClick={() => moveSectionUp(idx)} className="text-muted-foreground hover:text-foreground">
                            <GripVertical className="w-3 h-3" />
                          </button>
                          <span className="flex-1 text-[11px] font-medium truncate">{section.title}</span>
                          <Switch
                            checked={section.visible}
                            onCheckedChange={() => toggleSectionVisibility(section.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <Button className="w-full justify-start" size="sm" onClick={handleExportPdf} disabled={exportLoading}>
                    {exportLoading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-2" />}
                    PDF
                  </Button>
                  <Button variant="secondary" className="w-full justify-start" size="sm" onClick={handleExportDocx} disabled={exportLoading}>
                    {exportLoading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-2" />}
                    DOCX
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Center — Scrollable CV Preview */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-auto h-[calc(100vh-220px)] bg-muted/30">
                  <div className="min-w-fit p-4 flex justify-center">
                    {activeContent.trim() || sections.length > 0 ? (
                      <ResumePreview
                        ref={previewRef}
                        sections={sections.length ? sections : parsedSections}
                        theme={selectedTheme}
                        customColor={customColor || undefined}
                        template={selectedTemplate}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <Eye className="w-8 h-8 mb-3 opacity-50" />
                        <p>Add resume content to see a live preview.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right sidebar — AI Chat */}
            <Card className="flex flex-col overflow-hidden">
              <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  AI CV Editor
                </CardTitle>
                <CardDescription className="text-xs">Full control to edit your CV</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-3 pt-0 min-h-0">
                {/* Quick action buttons */}
                <div className="flex flex-wrap gap-1 mb-2 shrink-0">
                  {quickEditActions.map(action => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      disabled={chatLoading || (sections.length === 0 && parsedSections.length === 0)}
                      onClick={() => handleChatSend(action.prompt)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>

                {/* Chat messages */}
                <ScrollArea className="flex-1 mb-3">
                  <div className="space-y-2 pr-2">
                    {chatMessages.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-6">
                        <Sparkles className="w-5 h-5 mx-auto mb-2 opacity-40" />
                        <p>Ask AI to edit your CV.</p>
                        <p className="mt-1 opacity-70 text-[10px]">
                          Try: "Add a projects section" · "Remove education" · "Make summary shorter"
                        </p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`text-xs p-2 rounded-lg max-w-[95%] ${
                          msg.role === 'user'
                            ? 'ml-auto bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground p-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Editing your CV...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* Chat input */}
                <div className="flex gap-1.5 shrink-0">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
                    placeholder="Type any edit instruction..."
                    className="text-xs h-8"
                    disabled={chatLoading}
                  />
                  <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => handleChatSend()} disabled={chatLoading || !chatInput.trim()}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SCORE TAB */}
        <TabsContent value="score" className="space-y-4">
          {scoreData ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Overall Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center">
                    <div className={`text-5xl font-bold ${
                      scoreData.overall_score >= 80 ? 'text-status-employed' :
                      scoreData.overall_score >= 60 ? 'text-status-interview' : 'text-destructive'
                    }`}>
                      {scoreData.overall_score}
                    </div>
                    <span className="text-sm text-muted-foreground mt-1">out of 100</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: 'Keyword Match', value: scoreData.keyword_match },
                      { label: 'Experience Relevance', value: scoreData.experience_relevance },
                      { label: 'Formatting', value: scoreData.formatting },
                      { label: 'Impact Bullets', value: scoreData.impact_bullets },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.label}</span>
                          <span className="font-medium">{item.value}</span>
                        </div>
                        <Progress value={item.value} className="h-2" />
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-muted-foreground">{scoreData.summary}</p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {scoreData.strengths?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-status-employed" />
                        Strengths
                      </h4>
                      <ul className="space-y-1">
                        {scoreData.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Star className="w-3.5 h-3.5 mt-0.5 text-status-interview shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scoreData.improvements?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-status-interview" />
                        Improvements
                      </h4>
                      <div className="space-y-2">
                        {scoreData.improvements.map((imp: any, i: number) => (
                          <div key={i} className="p-3 rounded-md border bg-card">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{imp.area}</span>
                              <Badge variant={getPriorityColor(imp.priority) as any} className="text-xs">
                                {imp.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{imp.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {scoreData.missing_keywords?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Missing Keywords</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {scoreData.missing_keywords.map((kw: string, i: number) => (
                          <Badge key={i} variant="outline">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleTailor} disabled={aiLoading}>
                      <Target className="w-4 h-4 mr-1" />
                      Re-tailor with Fixes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="w-8 h-8 text-muted-foreground/50 mb-3" />
                <h3 className="font-semibold mb-1">No Score Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Go to the Tailor tab and click "Score Resume" to get an ATS compatibility score with recommendations.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tailored Resume History</CardTitle>
              <CardDescription>Previously tailored resumes you've saved</CardDescription>
            </CardHeader>
            <CardContent>
              {tailoredResumes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <BookOpen className="w-8 h-8 mb-3 opacity-50" />
                  <p>No saved tailored resumes yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tailoredResumes.map((tr) => (
                    <div
                      key={tr.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setTailoredContent(tr.tailored_content);
                        setJobDescription(tr.job_description);
                        if (tr.score) setScoreData({ overall_score: tr.score, ...tr.recommendations });
                        setActiveTab('result');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {tr.job_title || tr.company_name || 'Tailored Resume'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(tr.created_at).toLocaleDateString()} · {tr.job_description.slice(0, 80)}...
                          </p>
                        </div>
                        {tr.score && (
                          <Badge variant={tr.score >= 80 ? 'default' : tr.score >= 60 ? 'secondary' : 'destructive'}>
                            Score: {tr.score}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
