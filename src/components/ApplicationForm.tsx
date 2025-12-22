import { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus, ApplicationType, Interview, InterviewType } from '@/types/application';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: JobApplication | null;
  onSubmit: (data: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const statusOptions: ApplicationStatus[] = [
  'Applied',
  'Under Review',
  'Interview Stage',
  'Offer Received',
  'Rejected',
  'Employed',
  'Offer Declined',
  'Withdrawn',
];

const typeOptions: ApplicationType[] = ['Job', 'Bootcamp', 'Internship', 'Freelance', 'Contract'];

const interviewTypes: InterviewType[] = ['Phone Screen', 'Technical', 'Behavioral', 'Final', 'HR', 'Other'];

export function ApplicationForm({ open, onOpenChange, application, onSubmit }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    jobTitle: '',
    companyName: '',
    companyWebsite: '',
    contactInfo: '',
    dateApplied: format(new Date(), 'yyyy-MM-dd'),
    applicationType: 'Job' as ApplicationType,
    status: 'Applied' as ApplicationStatus,
    notes: '',
    interviews: [] as Interview[],
  });

  useEffect(() => {
    if (application) {
      setFormData({
        jobTitle: application.jobTitle,
        companyName: application.companyName,
        companyWebsite: application.companyWebsite || '',
        contactInfo: application.contactInfo || '',
        dateApplied: application.dateApplied,
        applicationType: application.applicationType,
        status: application.status,
        notes: application.notes || '',
        interviews: application.interviews || [],
      });
    } else {
      setFormData({
        jobTitle: '',
        companyName: '',
        companyWebsite: '',
        contactInfo: '',
        dateApplied: format(new Date(), 'yyyy-MM-dd'),
        applicationType: 'Job',
        status: 'Applied',
        notes: '',
        interviews: [],
      });
    }
  }, [application, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  const addInterview = () => {
    const newInterview: Interview = {
      id: crypto.randomUUID(),
      type: 'Phone Screen',
      date: format(new Date(), 'yyyy-MM-dd'),
      completed: false,
    };
    setFormData(prev => ({
      ...prev,
      interviews: [...prev.interviews, newInterview],
    }));
  };

  const updateInterview = (id: string, updates: Partial<Interview>) => {
    setFormData(prev => ({
      ...prev,
      interviews: prev.interviews.map(i => i.id === id ? { ...i, ...updates } : i),
    }));
  };

  const removeInterview = (id: string) => {
    setFormData(prev => ({
      ...prev,
      interviews: prev.interviews.filter(i => i.id !== id),
    }));
  };

  const showInterviews = formData.status === 'Interview Stage';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{application ? 'Edit Application' : 'Add New Application'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={e => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                placeholder="Software Engineer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Acme Inc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyWebsite">Company Website</Label>
              <Input
                id="companyWebsite"
                value={formData.companyWebsite}
                onChange={e => setFormData(prev => ({ ...prev, companyWebsite: e.target.value }))}
                placeholder="https://acme.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInfo">Contact Info</Label>
              <Input
                id="contactInfo"
                value={formData.contactInfo}
                onChange={e => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                placeholder="recruiter@acme.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateApplied">Date Applied *</Label>
              <Input
                id="dateApplied"
                type="date"
                value={formData.dateApplied}
                onChange={e => setFormData(prev => ({ ...prev, dateApplied: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Application Type</Label>
              <Select
                value={formData.applicationType}
                onValueChange={(value: ApplicationType) => 
                  setFormData(prev => ({ ...prev, applicationType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: ApplicationStatus) => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this application..."
              rows={3}
            />
          </div>

          {showInterviews && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Interviews</Label>
                <Button type="button" variant="outline" size="sm" onClick={addInterview}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Interview
                </Button>
              </div>

              {formData.interviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No interviews scheduled. Click "Add Interview" to track interview rounds.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.interviews.map((interview, index) => (
                    <div key={interview.id} className="border rounded-lg p-4 space-y-3 bg-secondary/30">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Interview {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeInterview(interview.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={interview.type}
                            onValueChange={(value: InterviewType) => 
                              updateInterview(interview.id, { type: value })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {interviewTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={interview.date}
                            onChange={e => updateInterview(interview.id, { date: e.target.value })}
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Interviewer</Label>
                          <Input
                            value={interview.interviewerName || ''}
                            onChange={e => updateInterview(interview.id, { interviewerName: e.target.value })}
                            placeholder="Name"
                            className="h-9"
                          />
                        </div>

                        <div className="flex items-end">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`completed-${interview.id}`}
                              checked={interview.completed}
                              onCheckedChange={(checked) => 
                                updateInterview(interview.id, { completed: checked as boolean })
                              }
                            />
                            <Label htmlFor={`completed-${interview.id}`} className="text-sm">
                              Completed
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Notes</Label>
                        <Textarea
                          value={interview.notes || ''}
                          onChange={e => updateInterview(interview.id, { notes: e.target.value })}
                          placeholder="Interview notes..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Follow-up Actions</Label>
                        <Input
                          value={interview.followUp || ''}
                          onChange={e => updateInterview(interview.id, { followUp: e.target.value })}
                          placeholder="Send thank you email, etc."
                          className="h-9"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {application ? 'Save Changes' : 'Add Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
