import { useMemo } from 'react';
import { JobApplication, statusDisplayMap, typeDisplayMap } from '@/types/application';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { format, parseISO, startOfMonth, subMonths, isAfter, isBefore, endOfMonth } from 'date-fns';
import { TrendingUp, Target, Calendar, Award } from 'lucide-react';

interface AnalyticsDashboardProps {
  applications: JobApplication[];
}

const STATUS_COLORS: Record<string, string> = {
  applied: 'hsl(var(--status-applied))',
  under_review: 'hsl(var(--status-review))',
  interview_stage: 'hsl(var(--status-interview))',
  offer_received: 'hsl(var(--status-offer))',
  rejected: 'hsl(var(--status-rejected))',
  employed: 'hsl(var(--status-employed))',
  offer_declined: 'hsl(var(--muted-foreground))',
  withdrawn: 'hsl(var(--muted-foreground))',
};

const TYPE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function AnalyticsDashboard({ applications }: AnalyticsDashboardProps) {
  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((app) => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: statusDisplayMap[status as keyof typeof statusDisplayMap] || status,
      value: count,
      status,
    }));
  }, [applications]);

  // Type distribution
  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((app) => {
      counts[app.applicationType] = (counts[app.applicationType] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      name: typeDisplayMap[type as keyof typeof typeDisplayMap] || type,
      value: count,
    }));
  }, [applications]);

  // Applications over time (last 6 months)
  const timelineData = useMemo(() => {
    const now = new Date();
    const months: { month: string; applications: number; interviews: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(monthStart);
      const monthLabel = format(monthStart, 'MMM yyyy');

      const appsInMonth = applications.filter((app) => {
        const appDate = parseISO(app.dateApplied);
        return isAfter(appDate, monthStart) && isBefore(appDate, monthEnd);
      });

      const interviewsInMonth = applications.flatMap((app) =>
        app.interviews.filter((i) => {
          const iDate = parseISO(i.scheduledDate);
          return isAfter(iDate, monthStart) && isBefore(iDate, monthEnd);
        })
      );

      months.push({
        month: monthLabel,
        applications: appsInMonth.length,
        interviews: interviewsInMonth.length,
      });
    }

    return months;
  }, [applications]);

  // Key metrics
  const metrics = useMemo(() => {
    const totalApps = applications.length;
    const totalInterviews = applications.reduce((acc, app) => acc + app.interviews.length, 0);
    const offers = applications.filter((a) => ['offer_received', 'employed'].includes(a.status)).length;
    const responseRate = totalApps > 0 
      ? Math.round((applications.filter((a) => a.status !== 'applied').length / totalApps) * 100) 
      : 0;
    const interviewRate = totalApps > 0 
      ? Math.round((applications.filter((a) => a.interviews.length > 0).length / totalApps) * 100) 
      : 0;
    const offerRate = totalApps > 0 ? Math.round((offers / totalApps) * 100) : 0;

    return {
      totalApps,
      totalInterviews,
      offers,
      responseRate,
      interviewRate,
      offerRate,
    };
  }, [applications]);

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Add some applications to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.responseRate}%</p>
                <p className="text-sm text-muted-foreground">Response Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-interview/10">
                <Calendar className="w-5 h-5 text-status-interview" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.interviewRate}%</p>
                <p className="text-sm text-muted-foreground">Interview Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-offer/10">
                <Award className="w-5 h-5 text-status-offer" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.offerRate}%</p>
                <p className="text-sm text-muted-foreground">Offer Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-employed/10">
                <TrendingUp className="w-5 h-5 text-status-employed" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalInterviews}</p>
                <p className="text-sm text-muted-foreground">Total Interviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="applications" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  name="Applications"
                />
                <Line 
                  type="monotone" 
                  dataKey="interviews" 
                  stroke="hsl(var(--status-interview))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--status-interview))' }}
                  name="Interviews"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_COLORS[entry.status] || 'hsl(var(--muted))'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Application Types Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Applications by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={typeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {typeData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
