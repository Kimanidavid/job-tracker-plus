import { useState, useEffect } from 'react';
import { 
  JobApplication, 
  ApplicationStatus, 
  ApplicationType, 
  Interview, 
  InterviewType,
  statusDisplayMap,
  typeDisplayMap,
  interviewTypeDisplayMap 
} from '@/types/application';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: JobApplication | null;
  onSubmit: (data: {
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
  }) => void;
}

const statusOptions: ApplicationStatus[] = [
  'applied',
  'under_review',
  'interview_stage',
  'offer_received',
  'rejected',
  'employed',
  'offer_declined',
  'withdrawn',
];

const typeOptions: ApplicationType[] = ['job', 'bootcamp', 'internship', 'freelance', 'contract', 'other'];

const interviewTypes: InterviewType[] = ['phone_screen', 'technical', 'behavioral', 'final', 'other'];

interface FormInterview {
  id: string;
  type: InterviewType;
  scheduledDate: string;
  interviewerName?: string;
  notes?: string;
  followUp?: string;
  completed: boolean;
}

export function ApplicationForm({ open, onOpenChange, application, onSubmit }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    jobTitle: '',
    companyName: '',
    companyWebsite: '',
    contactInfo: '',
    dateApplied: format(new Date(), 'yyyy-MM-dd'),
    applicationType: 'job' as ApplicationType,
    status: 'applied' as ApplicationStatus,
    notes: '',
    interviews: [] as FormInterview[],
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
        interviews: application.interviews.map(i => ({
          id: i.id,
          type: i.type,
          scheduledDate: i.scheduledDate.split('T')[0] + 'T' + (i.scheduledDate.split('T')[1]?.substring(0, 5) || '09:00'),
          interviewerName: i.interviewerName,
          notes: i.notes,
          followUp: i.followUp,
          completed: i.completed,
        })),
      });
    } else {
      setFormData({
        jobTitle: '',
        companyName: '',
        companyWebsite: '',
        contactInfo: '',
        dateApplied: format(new Date(), 'yyyy-MM-dd'),
        applicationType: 'job',
        status: 'applied',
        notes: '',
        interviews: [],
      });
    }
  }, [application, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      jobTitle: formData.jobTitle,
      companyName: formData.companyName,
      companyWebsite: formData.companyWebsite || undefined,
      contactInfo: formData.contactInfo || undefined,
      dateApplied: formData.dateApplied,
      applicationType: formData.applicationType,
      status: formData.status,
      notes: formData.notes || undefined,
      interviews: formData.interviews.map(i => ({
        type: i.type,
        scheduledDate: new Date(i.scheduledDate).toISOString(),
        interviewerName: i.interviewerName || undefined,
        notes: i.notes || undefined,
        followUp: i.followUp || undefined,
        completed: i.completed,
      })),
    });
    onOpenChange(false);
  };

  const addInterview = () => {
    const newInterview: FormInterview = {
      id: crypto.randomUUID(),
      type: 'phone_screen',
      scheduledDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      completed: false,
    };
    setFormData(prev => ({
      ...prev,
      interviews: [...prev.interviews, newInterview],
    }));
  };

  const updateInterview = (id: string, updates: Partial<FormInterview>) => {
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

  const showInterviews = formData.status === 'interview_stage';

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
                    <SelectItem key={type} value={type}>{typeDisplayMap[type]}</SelectItem>
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
                    <SelectItem key={status} value={status}>{statusDisplayMap[status]}</SelectItem>
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
                                <SelectItem key={type} value={type}>{interviewTypeDisplayMap[type]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Date & Time</Label>
                          <Input
                            type="datetime-local"
                            value={interview.scheduledDate}
                            onChange={e => updateInterview(interview.id, { scheduledDate: e.target.value })}
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
