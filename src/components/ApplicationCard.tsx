import { JobApplication } from '@/types/application';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Calendar, ExternalLink, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ApplicationCardProps {
  application: JobApplication;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
}

export function ApplicationCard({ application, onEdit, onDelete }: ApplicationCardProps) {
  const hasInterviews = application.interviews.length > 0;
  const upcomingInterviews = application.interviews.filter(
    i => !i.completed && new Date(i.date) >= new Date()
  );

  return (
    <Card className="card-hover animate-fade-in group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg truncate">{application.jobTitle}</h3>
              <StatusBadge status={application.status} />
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="truncate">{application.companyName}</span>
              {application.companyWebsite && (
                <a 
                  href={application.companyWebsite.startsWith('http') ? application.companyWebsite : `https://${application.companyWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Applied {format(new Date(application.dateApplied), 'MMM d, yyyy')}</span>
              </div>
              
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground'
              )}>
                {application.applicationType}
              </span>

              {hasInterviews && (
                <span className="flex items-center gap-1.5 text-status-interview">
                  <MessageSquare className="w-4 h-4" />
                  {upcomingInterviews.length > 0 
                    ? `${upcomingInterviews.length} upcoming` 
                    : `${application.interviews.length} interview${application.interviews.length > 1 ? 's' : ''}`
                  }
                </span>
              )}
            </div>

            {application.notes && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                {application.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(application)}
              className="h-8 w-8"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(application.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
