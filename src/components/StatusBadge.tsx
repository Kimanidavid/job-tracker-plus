import { ApplicationStatus, statusDisplayMap } from '@/types/application';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

const statusStyles: Record<ApplicationStatus, string> = {
  applied: 'status-applied',
  under_review: 'status-review',
  interview_stage: 'status-interview',
  offer_received: 'status-offer',
  rejected: 'status-rejected',
  employed: 'status-employed',
  offer_declined: 'status-withdrawn',
  withdrawn: 'status-withdrawn',
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
      {statusDisplayMap[status]}
    </span>
  );
}
