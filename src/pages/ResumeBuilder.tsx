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
  User, Briefcase, X, Mic, Undo2, Redo2, Check, RotateCcw,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  return orderSections(sections);
}

/** Enforce CV section order: header → summary → experience → education → skills → custom */
export function orderSections(sections: ResumeSection[]): ResumeSection[] {
  const rank: Record<ResumeSection['type'], number> = {
    header: 0, summary: 1, experience: 2, education: 3, skills: 4, custom: 5,
  };
  return [...sections].sort((a, b) => {
    const ra = rank[a.type] ?? 5;
    const rb = rank[b.type] ?? 5;
    if (ra !== rb) return ra - rb;
    return 0;
  });
}

/** Diff two section arrays, return ids whose content changed (or are new). */
function diffChangedIds(prev: ResumeSection[], next: ResumeSection[]): string[] {
  const prevById = new Map(prev.map(s => [s.id, s]));
  const prevByTitle = new Map(prev.map(s => [s.title.toLowerCase().trim(), s]));
  const changed: string[] = [];
  for (const s of next) {
    const p = prevById.get(s.id) || prevByTitle.get(s.title.toLowerCase().trim());
    if (!p || p.content.trim() !== s.content.trim()) changed.push(s.id);
  }
  return changed;
}

type ViewMode = 'landing' | 'editor';
type EditorMode = 'base' | 'tailored';

function SortableSectionRow({ id, disabled, children }: { id: string; disabled?: boolean; children: (handleProps: { listeners: any; attributes: any; setActivatorRef: (el: HTMLElement | null) => void }) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ listeners, attributes, setActivatorRef: setActivatorNodeRef })}
    </div>
  );
}


export default function ResumeBuilder() {
  const { toast } = useToast();
  const {
    resumes, baseResume, isLoading, saveResume, deleteResume,
    tailoredResumes, saveTailoredResume,
  } = useResumes();

  // ── Top-level navigation state ──
  const [view, setView] = useState<ViewMode>('editor');
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

  // Section editing & change-review
  const [pendingEdit, setPendingEdit] = useState<{ previousSections: ResumeSection[]; changedSectionIds: string[] } | null>(null);
  const [sectionEditingId, setSectionEditingId] = useState<string | null>(null);
  const [sectionEditDraft, setSectionEditDraft] = useState('');
  const [sectionAiInstruction, setSectionAiInstruction] = useState('');
  const [sectionAiLoadingId, setSectionAiLoadingId] = useState<string | null>(null);
  const [sectionsPanelOpen, setSectionsPanelOpen] = useState(true);

  const activeContent = tailoredContent || resumeContent;
  const parsedSections = useMemo(() => parseResumeToSections(activeContent), [activeContent]);
  const liveSections = useMemo(
    () => (sections.length ? sections : orderSections(parsedSections)),
    [sections, parsedSections],
  );

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const current = sections.length ? sections : orderSections(parsedSections);
    const oldIndex = current.findIndex(s => s.id === active.id);
    const newIndex = current.findIndex(s => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    let next = arrayMove(current, oldIndex, newIndex);
    // Always keep header pinned to top
    const headerIdx = next.findIndex(s => s.type === 'header');
    if (headerIdx > 0) {
      const [hdr] = next.splice(headerIdx, 1);
      next = [hdr, ...next];
    }
    setSections(next);
  };

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

  const openCreateDialog = () => {
    setCreateMode('upload');
    setNewJobTitle('');
    setNewSetAsBase(true);
    setPendingFile(null);
    setCreateDialogOpen(true);
  };

  const handleCreateContinue = async () => {
    if (!newJobTitle.trim()) {
      toast({ title: 'Add a job title', description: 'Used to name your CV.', variant: 'destructive' });
      return;
    }
    if (createMode === 'upload' && !pendingFile) {
      toast({ title: 'Pick a file to upload', variant: 'destructive' });
      return;
    }

    // Reset editor state
    setResumeTitle(newJobTitle.trim());
    setSections([]);
    setSelectedResumeId(null);
    setTailoredContent('');
    setJobDescription('');
    setEditorMode('base');

    if (createMode === 'scratch') {
      setResumeContent('');
      setCreateDialogOpen(false);
      setView('editor');
      return;
    }

    // Upload path
    const file = pendingFile!;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 10MB', variant: 'destructive' });
      return;
    }

    setCreateDialogOpen(false);
    setView('editor');

    try {
      toast({ title: 'Parsing your CV...' });
      const content = await parseUploadedFile(file);
      if (!content) {
        toast({ title: 'Could not extract text', description: 'The file appears empty or image-based.', variant: 'destructive' });
        return;
      }
      setResumeContent(content);

      toast({ title: 'Structuring CV with AI...' });
      setAiLoading(true);
      try {
        const formatted = await callResumeAI('format', { resume: content });
        if (formatted && formatted.person_name) {
          setSections(convertAIFormatToSections(formatted));
          setPiName(formatted.person_name || '');
          setPiRole(formatted.tagline || '');
          const contact = (formatted.contact_lines || []).join(' · ');
          const emailMatch = contact.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
          const phoneMatch = contact.match(/\+?\d[\d\s().-]{6,}/);
          if (emailMatch) setPiEmail(emailMatch[0]);
          if (phoneMatch) setPiPhone(phoneMatch[0]);
          toast({ title: 'CV ready!' });
        } else {
          setSections(parseResumeToSections(content));
        }
      } catch {
        setSections(parseResumeToSections(content));
      } finally { setAiLoading(false); }

      // Persist if user opted in
      if (newSetAsBase) {
        saveResume.mutate({ title: newJobTitle.trim(), content, is_base: true });
      }
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
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
    const flat = liveSections.length
      ? liveSections.map(s => (s.type === 'header' ? s.content : `${s.title}\n${s.content}`)).join('\n\n')
      : resumeContent;
    if (!flat.trim()) {
      toast({ title: 'Resume content is empty', variant: 'destructive' });
      return;
    }
    setResumeContent(flat);
    saveResume.mutate({
      id: selectedResumeId || undefined,
      title: resumeTitle || 'My Resume',
      content: flat,
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

  // ── Intent classification: distinguish edit requests from conversation ──
  const EDIT_INTENT_RE = /\b(add|adds|adding|remove|removes|removing|delete|deletes|deleting|change|changes|changing|update|updates|updating|rewrite|rewrites|rephrase|rephrases|fix|fixes|fixing|improve|improves|improving|tailor|tailors|tailoring|replace|replaces|replacing|insert|inserts|inserting|shorten|shortens|expand|expands|move|moves|reorder|reorders|reword|rewords|optimi[sz]e|optimi[sz]es|highlight|highlights|bold|put|edit|edits|editing|append|appends|create|creates|make (?:it|this|the|my) (?:sound|stronger|shorter|longer|better|more)|turn (?:this|it) into|convert)\b/i;

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

      const isEditIntent = EDIT_INTENT_RE.test(msg);

      if (!isEditIntent) {
        // Conversation / advice — do NOT modify the CV
        const reply = await callResumeAI('chat', { resume: resumeText, editInstruction: msg });
        setChatMessages(prev => [...prev, { role: 'assistant', content: reply || 'Sorry, no response.' }]);
        return;
      }

      // Edit intent
      const enhancedInstruction = `You have full control to edit this CV. The user's request: "${msg}"

Guidelines:
- Make ONLY the changes the user explicitly asked for
- Preserve everything else exactly as-is
- Keep formatting consistent (use "- " for bullets)
- For new sections, give them appropriate titles

Return the complete updated CV.`;

      const result = await callResumeAI('edit', { resume: resumeText, editInstruction: enhancedInstruction });
      if (result) {
        const previousSections = liveSections;
        let nextSections: ResumeSection[];
        try {
          const formatted = await callResumeAI('format', { resume: result });
          nextSections = (formatted && formatted.person_name)
            ? convertAIFormatToSections(formatted)
            : orderSections(parseResumeToSections(result));
        } catch {
          nextSections = orderSections(parseResumeToSections(result));
        }
        setSections(nextSections);
        const changedIds = diffChangedIds(previousSections, nextSections);
        setPendingEdit({ previousSections, changedSectionIds: changedIds });
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `✓ Updated ${changedIds.length} section${changedIds.length === 1 ? '' : 's'}. Review the highlighted area${changedIds.length === 1 ? '' : 's'} and Keep or Discard the changes.`,
        }]);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  // ── Section-level editing ──
  const startManualEdit = (section: ResumeSection) => {
    setSectionEditingId(section.id);
    setSectionEditDraft(section.content);
  };

  const saveManualEdit = () => {
    if (!sectionEditingId) return;
    const previousSections = liveSections;
    const next = liveSections.map(s =>
      s.id === sectionEditingId ? { ...s, content: sectionEditDraft } : s,
    );
    setSections(next);
    setSectionEditingId(null);
    setSectionEditDraft('');
    // Manual edits aren't AI changes — no review banner.
    void previousSections;
  };

  const runSectionAiEdit = async (section: ResumeSection, instruction: string) => {
    if (!instruction.trim()) return;
    setSectionAiLoadingId(section.id);
    try {
      const newContent = await callResumeAI('edit_section', {
        resume: section.content,
        editInstruction: instruction,
      });
      if (typeof newContent === 'string' && newContent.trim()) {
        const previousSections = liveSections;
        const next = liveSections.map(s =>
          s.id === section.id ? { ...s, content: newContent.trim() } : s,
        );
        setSections(next);
        setPendingEdit({ previousSections, changedSectionIds: [section.id] });
        setSectionAiInstruction('');
        toast({ title: 'Section updated', description: 'Review highlighted change in the preview.' });
      }
    } catch (err: any) {
      toast({ title: 'AI edit failed', description: err.message, variant: 'destructive' });
    } finally {
      setSectionAiLoadingId(null);
    }
  };

  // ── Generate Skills (Claude-style skill catalogue) ──
  const [generatingSkills, setGeneratingSkills] = useState(false);
  const handleGenerateSkills = async () => {
    if (liveSections.length === 0) {
      toast({ title: 'Add resume content first', description: 'Upload a CV or create one before generating skills.', variant: 'destructive' });
      return;
    }
    setGeneratingSkills(true);
    try {
      const flat = liveSections.map(s =>
        s.type === 'header' ? s.content : `${s.title}\n${s.content}`,
      ).join('\n\n');
      const result = await callResumeAI('generate_skills', { resume: flat });
      const categories: { label: string; items: string[] }[] = result?.categories ?? [];
      if (!categories.length) throw new Error('No skills returned');

      const skillsContent = categories
        .map(c => `${c.label}\n${c.items.map(i => `- ${i}`).join('\n')}`)
        .join('\n\n');

      const previousSections = liveSections;
      const existingSkills = liveSections.find(s => s.type === 'skills');
      let next: ResumeSection[];
      let changedId: string;
      if (existingSkills) {
        changedId = existingSkills.id;
        next = liveSections.map(s =>
          s.id === existingSkills.id ? { ...s, content: skillsContent, visible: true } : s,
        );
      } else {
        const newSection: ResumeSection = {
          id: crypto.randomUUID(),
          type: 'skills',
          title: 'Skills',
          content: skillsContent,
          visible: true,
        };
        changedId = newSection.id;
        next = orderSections([...liveSections, newSection]);
      }
      setSections(next);
      setPendingEdit({ previousSections, changedSectionIds: [changedId] });
      toast({ title: 'Skills generated', description: 'Review the highlighted Skills section and Keep or Discard.' });
    } catch (err: any) {
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingSkills(false);
    }
  };

  const keepPendingChanges = () => {
    setPendingEdit(null);
    if (selectedResumeId || resumeContent.trim()) {
      // Persist as base resume content from current sections
      const flat = liveSections.map(s =>
        s.type === 'header' ? s.content : `${s.title}\n${s.content}`,
      ).join('\n\n');
      setResumeContent(flat);
      saveResume.mutate({
        id: selectedResumeId || undefined,
        title: resumeTitle || 'My Resume',
        content: flat,
        is_base: true,
      });
    }
  };

  const discardPendingChanges = () => {
    if (pendingEdit) setSections(pendingEdit.previousSections);
    setPendingEdit(null);
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

  // Landing/base-resumes view removed — always go straight to the editor.


  // ─────────────────────────────────────────────────────
  // EDITOR VIEW
  // ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/20">
      {/* Top bar */}
      <header className="grid grid-cols-3 items-center gap-2 px-4 py-2 border-b bg-card shrink-0">
        {/* Left segment */}
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fileInputRef.current?.click()} title="Upload resume">
            <Upload className="w-4 h-4" />
          </Button>
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.md" className="hidden" onChange={handleFileUpload} />
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
          <Button variant="destructive" size="sm" className="h-8 text-xs ml-2" onClick={() => setShowAssistant(false)}>
            Close Chat
          </Button>
        </div>

        {/* Right segment */}
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant={showLayoutStyle ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setShowLayoutStyle(v => !v)}
          >
            <Palette className="w-3.5 h-3.5 mr-1" /> Layout & Style
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleSaveBase}
            disabled={saveResume.isPending || liveSections.length === 0}
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {selectedResumeId ? 'Update' : 'Save'}
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExportDocx} disabled={exportLoading}>
            {exportLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
            DOCX
          </Button>
          <Button size="sm" className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90" onClick={handleExportPdf} disabled={exportLoading}>
            {exportLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
            PDF
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

            {/* Section-by-section editor */}
            <Collapsible open={sectionsPanelOpen} onOpenChange={setSectionsPanelOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-2 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <LayoutTemplate className="w-4 h-4 text-primary" /> Sections
                      </CardTitle>
                      <ChevronDown className={`w-4 h-4 transition-transform ${sectionsPanelOpen ? '' : '-rotate-90'}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-2">
                    {liveSections.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground text-center py-3">
                        Upload a CV from the landing page to start editing sections.
                      </p>
                    ) : (
                      <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs mb-2 border-dashed"
                        onClick={handleGenerateSkills}
                        disabled={generatingSkills}
                        title={liveSections.some(s => s.type === 'skills') ? 'Regenerate Skills section with AI' : 'Add a Skills section with AI'}
                      >
                        {generatingSkills
                          ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          : <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />}
                        {liveSections.some(s => s.type === 'skills') ? 'Regenerate Skills with AI' : 'Generate Skills with AI'}
                      </Button>
                      </>
                    )}
                    {liveSections.length > 0 && (
                      <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                        <SortableContext items={liveSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                          {liveSections.map(section => {
                            const isEditingThis = sectionEditingId === section.id;
                            const isAiLoading = sectionAiLoadingId === section.id;
                            const isHeader = section.type === 'header';
                            return (
                              <SortableSectionRow key={section.id} id={section.id} disabled={isHeader}>
                                {({ listeners, attributes, setActivatorRef }) => (
                                  <div className="rounded-md border bg-background p-2 space-y-1.5 mb-2">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        ref={setActivatorRef}
                                        {...listeners}
                                        {...attributes}
                                        type="button"
                                        title={isHeader ? 'Header is pinned' : 'Drag to reorder'}
                                        disabled={isHeader}
                                        className={`h-7 w-5 flex items-center justify-center text-muted-foreground ${isHeader ? 'opacity-30 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:text-foreground'}`}
                                      >
                                        <GripVertical className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="flex-1 text-xs font-semibold truncate">{section.title}</span>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit with AI" disabled={isAiLoading}>
                                            {isAiLoading
                                              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                              : <Wand2 className="w-3.5 h-3.5 text-primary" />}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72 p-3" align="end">
                                          <p className="text-[11px] font-semibold mb-1.5">Edit "{section.title}" with AI</p>
                                          <Textarea
                                            placeholder="e.g. Make bullets stronger and add metrics"
                                            value={sectionAiInstruction}
                                            onChange={(e) => setSectionAiInstruction(e.target.value)}
                                            className="text-xs min-h-[70px]"
                                          />
                                          <div className="flex justify-end gap-1.5 mt-2">
                                            <Button
                                              size="sm"
                                              className="h-7 text-xs"
                                              onClick={() => runSectionAiEdit(section, sectionAiInstruction)}
                                              disabled={!sectionAiInstruction.trim() || isAiLoading}
                                            >
                                              <Sparkles className="w-3 h-3 mr-1" /> Apply
                                            </Button>
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        title="Edit manually"
                                        onClick={() => isEditingThis ? saveManualEdit() : startManualEdit(section)}
                                      >
                                        {isEditingThis
                                          ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                                          : <Pencil className="w-3.5 h-3.5" />}
                                      </Button>
                                      <Switch
                                        checked={section.visible}
                                        onCheckedChange={() => toggleSectionVisibility(section.id)}
                                      />
                                    </div>
                                    {isEditingThis && (
                                      <Textarea
                                        value={sectionEditDraft}
                                        onChange={(e) => setSectionEditDraft(e.target.value)}
                                        onBlur={saveManualEdit}
                                        className="text-xs font-mono min-h-[120px]"
                                        autoFocus
                                      />
                                    )}
                                  </div>
                                )}
                              </SortableSectionRow>
                            );
                          })}
                        </SortableContext>
                      </DndContext>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Layout & Style panel — appears when toggled */}

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
                      Hi! Ask me for advice or feedback on your CV. If you want me to change something, tell me to <strong>add</strong>, <strong>edit</strong>, <strong>remove</strong>, or <strong>improve</strong> it — I'll only modify the resume when you ask.
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
                Messages are processed by AI. Verify important information.
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

          {/* Review bar — shown after AI edits */}
          {pendingEdit && (
            <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 border-b border-amber-200">
              <div className="flex items-center gap-2 text-xs text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  AI edited <strong>{pendingEdit.changedSectionIds.length}</strong> section
                  {pendingEdit.changedSectionIds.length === 1 ? '' : 's'}. Review the highlighted area
                  {pendingEdit.changedSectionIds.length === 1 ? '' : 's'} below.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={discardPendingChanges}>
                  <RotateCcw className="w-3 h-3 mr-1" /> Discard
                </Button>
                <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={keepPendingChanges}>
                  <Check className="w-3 h-3 mr-1" /> Keep changes
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-6 flex justify-center min-w-max mx-auto">
              {liveSections.length > 0 ? (
                <div
                  style={{
                    width: `calc(210mm * ${previewZoom / 100})`,
                    height: `calc(297mm * ${previewZoom / 100})`,
                  }}
                >
                  <div
                    className="mx-auto"
                    style={{
                      transform: `scale(${previewZoom / 100})`,
                      transformOrigin: 'top left',
                      width: '210mm',
                    }}
                  >
                    <ResumePreview
                      ref={previewRef}
                      sections={liveSections}
                      theme={selectedTheme}
                      customColor={customColor || undefined}
                      template={selectedTemplate}
                      highlightedSectionIds={pendingEdit?.changedSectionIds}
                    />
                  </div>
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
