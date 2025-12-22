import { ApplicationStatus } from '@/types/application';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

const statusStyles: Record<ApplicationStatus, string> = {
  'Applied': 'status-applied',
  'Under Review': 'status-review',
  'Interview Stage': 'status-interview',
  'Offer Received': 'status-offer',
  'Rejected': 'status-rejected',
  'Employed': 'status-employed',
  'Offer Declined': 'status-withdrawn',
  'Withdrawn': 'status-withdrawn',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span 
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {status}
    </span>
  );
}
