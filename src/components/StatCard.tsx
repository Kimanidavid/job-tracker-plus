import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
}

export function StatCard({ title, value, icon: Icon, className, iconClassName }: StatCardProps) {
  return (
    <div className={cn(
      'bg-card rounded-xl border border-border p-6 card-hover',
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center',
          iconClassName || 'bg-primary/10 text-primary'
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
