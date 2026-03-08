import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useResumes, callResumeAI } from '@/hooks/useResumes';
import {
  FileText, Upload, Wand2, Target, CheckCircle2,
  Sparkles, Save, Trash2, Copy, ArrowRight, Loader2,
  AlertTriangle, Star, TrendingUp, BookOpen
} from 'lucide-react';

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
      const result = await callResumeAI('tailor', {
        resume: resumeContent,
        jobDescription,
      });
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
      const result = await callResumeAI('score', {
        resume: contentToScore,
        jobDescription,
      });
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
      const result = await callResumeAI('edit', {
        resume: content,
        editInstruction,
      });
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
    const content = tailoredContent || resumeContent;
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to clipboard' });
  };

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
        <TabsList className="grid w-full grid-cols-5">
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
                  Paste your resume content here. This will be stored and reused when tailoring for new jobs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
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
