import { Card, CardContent } from '@/components/ui/card';
import { Bot } from 'lucide-react';

export default function CareerAgent() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Career Agent</h1>
        <p className="text-muted-foreground">Your AI-powered career assistant</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-status-review/10 mb-4">
            <Bot className="w-8 h-8 text-status-review" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Full chat interface with AI for salary negotiation, interview prep, LinkedIn outreach, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
