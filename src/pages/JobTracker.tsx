import { useState, useMemo } from 'react';
import { useApplications } from '@/hooks/useApplications';
import { JobApplication, ApplicationStatus, ApplicationType, InterviewType } from '@/types/application';
import { ApplicationCard } from '@/components/ApplicationCard';
import { ApplicationForm } from '@/components/ApplicationForm';
import { SearchFilters } from '@/components/SearchFilters';
import { EmptyState } from '@/components/EmptyState';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, List, Kanban } from 'lucide-react';

export default function JobTracker() {
  const { applications, isLoading, addApplication, updateApplication, deleteApplication } = useApplications();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ApplicationType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'status'>('date');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredApplications = useMemo(() => {
    let result = [...applications];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(app =>
        app.jobTitle.toLowerCase().includes(query) ||
        app.companyName.toLowerCase().includes(query) ||
        app.notes?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') result = result.filter(app => app.status === statusFilter);
    if (typeFilter !== 'all') result = result.filter(app => app.applicationType === typeFilter);
    if (dateFrom) result = result.filter(app => app.dateApplied >= dateFrom);
    if (dateTo) result = result.filter(app => app.dateApplied <= dateTo);

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date': return new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime();
        case 'company': return a.companyName.localeCompare(b.companyName);
        case 'status': return a.status.localeCompare(b.status);
        default: return 0;
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

  const handleAddClick = () => { setEditingApp(null); setFormOpen(true); };
  const handleEdit = (app: JobApplication) => { setEditingApp(app); setFormOpen(true); };
  const handleDeleteClick = (id: string) => setDeleteId(id);

  const handleFormSubmit = async (data: {
    jobTitle: string; companyName: string; companyWebsite?: string; contactInfo?: string;
    dateApplied: string; applicationType: ApplicationType; status: ApplicationStatus; notes?: string;
    interviews?: Array<{ type: InterviewType; scheduledDate: string; interviewerName?: string; notes?: string; followUp?: string; completed: boolean; }>;
  }) => {
    if (editingApp) {
      await updateApplication(editingApp.id, data);
      toast({ title: 'Application updated' });
    } else {
      await addApplication(data);
      toast({ title: 'Application added' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteApplication(deleteId);
      toast({ title: 'Application deleted' });
      setDeleteId(null);
    }
  };

  // Kanban columns
  const kanbanColumns: { label: string; statuses: ApplicationStatus[] }[] = [
    { label: 'Applied', statuses: ['applied'] },
    { label: 'Screening', statuses: ['under_review'] },
    { label: 'Interview', statuses: ['interview_stage'] },
    { label: 'Offer', statuses: ['offer_received', 'employed'] },
    { label: 'Rejected', statuses: ['rejected', 'offer_declined', 'withdrawn'] },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Tracker</h1>
          <p className="text-muted-foreground">{filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
              <List className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'kanban' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('kanban')}>
              <Kanban className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleAddClick}>
            <Plus className="w-4 h-4 mr-2" />
            Add Application
          </Button>
        </div>
      </div>

      {applications.length > 0 && (
        <SearchFilters
          searchQuery={searchQuery} onSearchChange={setSearchQuery}
          statusFilter={statusFilter} onStatusChange={setStatusFilter}
          typeFilter={typeFilter} onTypeChange={setTypeFilter}
          sortBy={sortBy} onSortChange={setSortBy}
          dateFrom={dateFrom} dateTo={dateTo}
          onDateFromChange={setDateFrom} onDateToChange={setDateTo}
          onClearFilters={clearFilters} hasActiveFilters={!!hasActiveFilters}
        />
      )}

      {viewMode === 'list' ? (
        applications.length === 0 ? (
          <EmptyState onAddClick={handleAddClick} />
        ) : filteredApplications.length === 0 ? (
          <EmptyState onAddClick={handleAddClick} isFiltered />
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((app) => (
              <ApplicationCard key={app.id} application={app} onEdit={handleEdit} onDelete={handleDeleteClick} />
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const colApps = filteredApplications.filter(a => col.statuses.includes(a.status));
            return (
              <div key={col.label} className="min-w-[220px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{colApps.length}</span>
                </div>
                <div className="space-y-2">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-3 rounded-lg border bg-card hover:shadow-md cursor-pointer transition-all"
                      onClick={() => handleEdit(app)}
                    >
                      <p className="text-sm font-medium truncate">{app.jobTitle}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.companyName}</p>
                      {app.interviews.length > 0 && (
                        <p className="text-xs text-primary mt-1">{app.interviews.length} interview{app.interviews.length !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  ))}
                  {colApps.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">No applications</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ApplicationForm open={formOpen} onOpenChange={setFormOpen} application={editingApp} onSubmit={handleFormSubmit} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} onConfirm={handleDeleteConfirm} />
    </div>
  );
}
