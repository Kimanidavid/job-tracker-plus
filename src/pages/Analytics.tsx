import { useApplications } from '@/hooks/useApplications';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { CalendarView } from '@/components/CalendarView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, CalendarDays } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function Analytics() {
  const { applications, isLoading } = useApplications();

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Conversion funnel, stage breakdown, and calendar view</p>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="w-4 h-4" /> Calendar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard applications={applications} />
        </TabsContent>
        <TabsContent value="calendar" className="mt-6">
          <CalendarView applications={applications} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
