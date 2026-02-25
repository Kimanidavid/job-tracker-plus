import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApplications } from '@/hooks/useApplications';
import { JobApplication, ApplicationStatus, ApplicationType, InterviewType } from '@/types/application';
import { StatCard } from '@/components/StatCard';
import { ApplicationCard } from '@/components/ApplicationCard';
import { ApplicationForm } from '@/components/ApplicationForm';
import { SearchFilters } from '@/components/SearchFilters';
import { EmptyState } from '@/components/EmptyState';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { InterviewReminders } from '@/components/InterviewReminders';
import { CalendarView } from '@/components/CalendarView';
import { ExportButton } from '@/components/ExportButton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Briefcase,
  Clock,
  MessageSquare,
  Trophy,
  Plus,
  Loader2,
  LogOut,
  BarChart3,
  CalendarDays,
  List
} from 'lucide-react';

export default function Index() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { applications, isLoading, addApplication, updateApplication, deleteApplication, upcomingInterviews } = useApplications();
  const { toast } = useToast();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('applications');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ApplicationType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'status'>('date');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a =>
      ['applied', 'under_review'].includes(a.status)
    ).length;
    const interviews = applications.filter(a => a.status === 'interview_stage').length;
    const offers = applications.filter(a =>
      ['offer_received', 'employed'].includes(a.status)
    ).length;

    return { total, pending, interviews, offers };
  }, [applications]);

  // Filtered and sorted applications
  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(app =>
        app.jobTitle.toLowerCase().includes(query) ||
        app.companyName.toLowerCase().includes(query) ||
        app.notes?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(app => app.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(app => app.applicationType === typeFilter);
    }

    // Date range filter
    if (dateFrom) {
      result = result.filter(app => app.dateApplied >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(app => app.dateApplied <= dateTo);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime();
        case 'company':
          return a.companyName.localeCompare(b.companyName);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return result;
  }, [applications, searchQuery, statusFilter, typeFilter, sortBy, dateFrom, dateTo]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
  };

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
      toast({
        title: 'Application updated',
        description: `${data.jobTitle} at ${data.companyName} has been updated.`,
      });
    } else {
      await addApplication(data);
      toast({
        title: 'Application added',
        description: `${data.jobTitle} at ${data.companyName} has been added to your tracker.`,
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteApplication(deleteId);
      toast({
        title: 'Application deleted',
        description: 'The application has been removed from your tracker.',
      });
      setDeleteId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
                <img src="/Agenthire.png" alt="AgentHire Logo" className="w-5 h-5 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AgentHire</h1>
                <p className="text-sm text-muted-foreground">Get your dream job on auto pilot</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton applications={applications} />
              <Button onClick={handleAddClick}>
                <Plus className="w-4 h-4 mr-2" />
                Add Application
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Interview Reminders */}
        {upcomingInterviews.length > 0 && (
          <div className="mb-6 animate-slide-up">
            <InterviewReminders
              upcomingInterviews={upcomingInterviews}
              onViewApplication={handleEdit}
            />
          </div>
        )}

        {/* Stats Dashboard */}
        <section className="mb-8 animate-slide-up">
          <h2 className="text-lg font-semibold mb-4">Dashboard Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Applications"
              value={stats.total}
              icon={Briefcase}
            />
            <StatCard
              title="Pending Review"
              value={stats.pending}
              icon={Clock}
              iconClassName="bg-status-review/15 text-status-review"
            />
            <StatCard
              title="Interviews"
              value={stats.interviews}
              icon={MessageSquare}
              iconClassName="bg-status-interview/15 text-status-interview"
            />
            <StatCard
              title="Offers & Hired"
              value={stats.offers}
              icon={Trophy}
              iconClassName="bg-status-employed/15 text-status-employed"
            />
          </div>
        </section>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <TabsList className="mb-6">
            <TabsTrigger value="applications" className="gap-2">
              <List className="w-4 h-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Applications</h2>
              <span className="text-sm text-muted-foreground">
                {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
              </span>
            </div>

            {applications.length > 0 && (
              <div className="mb-6">
                <SearchFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  typeFilter={typeFilter}
                  onTypeChange={setTypeFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onDateFromChange={setDateFrom}
                  onDateToChange={setDateTo}
                  onClearFilters={clearFilters}
                  hasActiveFilters={!!hasActiveFilters}
                />
              </div>
            )}

            {applications.length === 0 ? (
              <EmptyState onAddClick={handleAddClick} />
            ) : filteredApplications.length === 0 ? (
              <EmptyState onAddClick={handleAddClick} isFiltered />
            ) : (
              <div className="space-y-3">
                {filteredApplications.map((app, index) => (
                  <div key={app.id} style={{ animationDelay: `${index * 0.05}s` }}>
                    <ApplicationCard
                      application={app}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard applications={applications} />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView applications={applications} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Application Form Modal */}
      <ApplicationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        application={editingApp}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
