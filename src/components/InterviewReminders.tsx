import { Interview, JobApplication, interviewTypeDisplayMap } from '@/types/application';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Clock, Building2, ChevronRight, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow, parseISO, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';

interface UpcomingInterview extends Interview {
  application: JobApplication;
}

interface InterviewRemindersProps {
  upcomingInterviews: UpcomingInterview[];
  onViewApplication?: (app: JobApplication) => void;
}

export function InterviewReminders({ upcomingInterviews, onViewApplication }: InterviewRemindersProps) {
  if (upcomingInterviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Interview Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No upcoming interviews in the next 7 days</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getUrgencyLevel = (scheduledDate: string) => {
    const date = parseISO(scheduledDate);
    const hoursUntil = differenceInHours(date, new Date());
    
    if (isToday(date) || hoursUntil < 24) return 'urgent';
    if (isTomorrow(date) || hoursUntil < 48) return 'soon';
    return 'upcoming';
  };

  const getTimeLabel = (scheduledDate: string) => {
    const date = parseISO(scheduledDate);
    
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    }
    return `${format(date, 'EEE, MMM d')} at ${format(date, 'h:mm a')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Interview Reminders
          <Badge variant="secondary" className="ml-auto">
            {upcomingInterviews.length} upcoming
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingInterviews.map((interview) => {
          const urgency = getUrgencyLevel(interview.scheduledDate);
          const isUrgent = urgency === 'urgent';
          const isSoon = urgency === 'soon';

          return (
            <div
              key={interview.id}
              className={cn(
                'p-4 rounded-lg border transition-colors',
                isUrgent && 'border-destructive/50 bg-destructive/5',
                isSoon && 'border-status-interview/50 bg-status-interview/5',
                !isUrgent && !isSoon && 'border-border bg-secondary/30'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'p-2 rounded-lg shrink-0',
                  isUrgent && 'bg-destructive/10',
                  isSoon && 'bg-status-interview/10',
                  !isUrgent && !isSoon && 'bg-muted'
                )}>
                  {isUrgent ? (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  ) : (
                    <Calendar className={cn(
                      'w-4 h-4',
                      isSoon ? 'text-status-interview' : 'text-muted-foreground'
                    )} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                      {interviewTypeDisplayMap[interview.type]}
                    </span>
                    {isUrgent && (
                      <Badge variant="destructive" className="text-xs">
                        Soon!
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate">{interview.application.companyName}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="truncate">{interview.application.jobTitle}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className={cn(
                      'flex items-center gap-1.5',
                      isUrgent && 'text-destructive font-medium',
                      isSoon && 'text-status-interview font-medium'
                    )}>
                      <Clock className="w-3.5 h-3.5" />
                      {getTimeLabel(interview.scheduledDate)}
                    </div>
                    <span className="text-muted-foreground text-xs">
                      ({formatDistanceToNow(parseISO(interview.scheduledDate), { addSuffix: true })})
                    </span>
                  </div>

                  {interview.interviewerName && (
                    <p className="text-sm text-muted-foreground mt-2">
                      With: {interview.interviewerName}
                    </p>
                  )}
                </div>

                {onViewApplication && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => onViewApplication(interview.application)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
