import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';

export default function AutopilotSearch() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Autopilot Search</h1>
        <p className="text-muted-foreground">Let AI find and score job matches for you</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-status-interview/10 mb-4">
            <Search className="w-8 h-8 text-status-interview" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Toggle the AI agent to search jobs by role description, get scored matches, and one-click add to your tracker.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
