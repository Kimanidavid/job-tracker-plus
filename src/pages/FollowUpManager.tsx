import { Card, CardContent } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export default function FollowUpManager() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Follow-up Manager</h1>
        <p className="text-muted-foreground">Timeline of active applications with AI-drafted follow-up emails</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-status-offer/10 mb-4">
            <Mail className="w-8 h-8 text-status-offer" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            View all active applications in a timeline and generate personalized follow-up emails with AI.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
