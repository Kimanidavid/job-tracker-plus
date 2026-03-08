import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplications } from '@/hooks/useApplications';
import { StatCard } from '@/components/StatCard';
import { InterviewReminders } from '@/components/InterviewReminders';
import { ExportButton } from '@/components/ExportButton';
import { ApplicationForm } from '@/components/ApplicationForm';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { JobApplication, ApplicationStatus, ApplicationType, InterviewType } from '@/types/application';
import {
  Briefcase,
  Clock,
  MessageSquare,
  Trophy,
  Plus,
  Loader2,
  FileText,
  Search,
  Mail,
  Bot,
  ArrowRight,
  TrendingUp,
  Flame,
} from 'lucide-react';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';

export default function Dashboard() {
  const { applications, isLoading, addApplication, updateApplication, deleteApplication, upcomingInterviews } = useApplications();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = applications.length;
    const applied = applications.filter(a => a.status === 'applied').length;
    const underReview = applications.filter(a => a.status === 'under_review').length;
    const interviews = applications.filter(a => a.status === 'interview_stage').length;
    const offers = applications.filter(a => ['offer_received', 'employed'].includes(a.status)).length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    const pending = applied + underReview;
    return { total, applied, underReview, interviews, offers, rejected, pending };
  }, [applications]);

  // Pipeline funnel data
  const funnel = useMemo(() => {
    const stages = [
      { label: 'Applied', count: stats.applied + stats.underReview, color: 'bg-primary' },
      { label: 'Screening', count: stats.underReview, color: 'bg-status-review' },
      { label: 'Interview', count: stats.interviews, color: 'bg-status-interview' },
      { label: 'Offer', count: stats.offers, color: 'bg-status-offer' },
    ];
    const max = Math.max(...stages.map(s => s.count), 1);
    return stages.map(s => ({ ...s, pct: (s.count / max) * 100 }));
  }, [stats]);

  // Hot applications (interviews coming up or recently active)
  const hotApplications = useMemo(() => {
    return applications
      .filter(a => ['interview_stage', 'under_review', 'offer_received'].includes(a.status))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [applications]);

  const aiTools = [
    { title: 'AI Resume Builder', desc: 'Tailor your resume with AI', icon: FileText, route: '/resume', color: 'text-primary' },
    { title: 'Autopilot Search', desc: 'Find matching jobs automatically', icon: Search, route: '/autopilot', color: 'text-status-interview' },
    { title: 'Follow-up Manager', desc: 'Draft follow-up emails with AI', icon: Mail, route: '/followups', color: 'text-status-offer' },
    { title: 'AI Career Agent', desc: 'Chat with your career assistant', icon: Bot, route: '/agent', color: 'text-status-review' },
  ];

  const handleAddClick = () => {
    setEditingApp(null);
    setFormOpen(true);
  };

  const handleEdit = (app: JobApplication) => {
    setEditingApp(app);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: {
    jobTitle: string;
    companyName: string;
    companyWebsite?: string;
    contactInfo?: string;
    dateApplied: string;
    applicationType: ApplicationType;
    status: ApplicationStatus;
    notes?: string;
    interviews?: Array<{
      type: InterviewType;
      scheduledDate: string;
      interviewerName?: string;
      notes?: string;
      followUp?: string;
      completed: boolean;
    }>;
  }) => {
    if (editingApp) {
      await updateApplication(editingApp.id, data);
      toast({ title: 'Application updated', description: `${data.jobTitle} at ${data.companyName} has been updated.` });
    } else {
      await addApplication(data);
      toast({ title: 'Application added', description: `${data.jobTitle} at ${data.companyName} has been added.` });
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteApplication(deleteId);
      toast({ title: 'Application deleted', description: 'The application has been removed.' });
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your job search at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton applications={applications} />
          <Button onClick={handleAddClick}>
            <Plus className="w-4 h-4 mr-2" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Interview Reminders */}
      {upcomingInterviews.length > 0 && (
        <InterviewReminders upcomingInterviews={upcomingInterviews} onViewApplication={handleEdit} />
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Applications" value={stats.total} icon={Briefcase} />
        <StatCard title="Pending Review" value={stats.pending} icon={Clock} iconClassName="bg-status-review/15 text-status-review" />
        <StatCard title="Interviews" value={stats.interviews} icon={MessageSquare} iconClassName="bg-status-interview/15 text-status-interview" />
        <StatCard title="Offers & Hired" value={stats.offers} icon={Trophy} iconClassName="bg-status-employed/15 text-status-employed" />
      </div>

      {/* Pipeline Funnel + Hot Applications */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Pipeline Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {funnel.map((stage) => (
              <div key={stage.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{stage.label}</span>
                  <span className="text-muted-foreground">{stage.count}</span>
                </div>
                <Progress value={stage.pct} className="h-2" />
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/analytics')}>
              View full analytics
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Hot Applications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="w-4 h-4 text-status-interview" />
              Hot Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hotApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No active applications yet</p>
            ) : (
              <div className="space-y-3">
                {hotApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleEdit(app)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{app.jobTitle}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.companyName}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary shrink-0 ml-2">
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/tracker')}>
              View all applications
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Tools Quick Launch */}
      <div>
        <h2 className="text-lg font-semibold mb-3">AI Tools</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiTools.map((tool) => (
            <Card
              key={tool.title}
              className="card-hover cursor-pointer group"
              onClick={() => navigate(tool.route)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-muted ${tool.color}`}>
                  <tool.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{tool.title}</p>
                  <p className="text-xs text-muted-foreground">{tool.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ApplicationForm open={formOpen} onOpenChange={setFormOpen} application={editingApp} onSubmit={handleFormSubmit} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} onConfirm={handleDeleteConfirm} />
    </div>
  );
}
