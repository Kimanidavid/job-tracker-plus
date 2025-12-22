import { Briefcase, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddClick: () => void;
  isFiltered?: boolean;
}

export function EmptyState({ onAddClick, isFiltered }: EmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Briefcase className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No matching applications</h3>
        <p className="text-muted-foreground max-w-sm">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Briefcase className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Start tracking your applications</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        Add your first job application to begin organizing your job search journey.
      </p>
      <Button onClick={onAddClick} size="lg">
        <Plus className="w-5 h-5 mr-2" />
        Add Your First Application
      </Button>
    </div>
  );
}
