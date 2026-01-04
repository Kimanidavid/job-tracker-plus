import { useMemo, useState } from 'react';
import { JobApplication, Interview, interviewTypeDisplayMap } from '@/types/application';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Building2
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO,
  isToday,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { cn } from '@/lib/utils';

interface UpcomingInterview extends Interview {
  application: JobApplication;
}

interface CalendarViewProps {
  applications: JobApplication[];
  onSelectDate?: (date: Date, interviews: UpcomingInterview[]) => void;
}

export function CalendarView({ applications, onSelectDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Build a map of interviews by date
  const interviewsByDate = useMemo(() => {
    const map = new Map<string, UpcomingInterview[]>();
    
    applications.forEach((app) => {
      app.interviews.forEach((interview) => {
        const dateKey = format(parseISO(interview.scheduledDate), 'yyyy-MM-dd');
        const existing = map.get(dateKey) || [];
        existing.push({ ...interview, application: app });
        map.set(dateKey, existing);
      });
    });
    
    return map;
  }, [applications]);

  // Build a map of applications by date applied
  const applicationsByDate = useMemo(() => {
    const map = new Map<string, JobApplication[]>();
    
    applications.forEach((app) => {
      const dateKey = format(parseISO(app.dateApplied), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      existing.push(app);
      map.set(dateKey, existing);
    });
    
    return map;
  }, [applications]);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateKey = format(date, 'yyyy-MM-dd');
    const interviews = interviewsByDate.get(dateKey) || [];
    onSelectDate?.(date, interviews);
  };

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedInterviews = selectedDateKey ? interviewsByDate.get(selectedDateKey) || [] : [];
  const selectedApplications = selectedDateKey ? applicationsByDate.get(selectedDateKey) || [] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayInterviews = interviewsByDate.get(dateKey) || [];
              const dayApplications = applicationsByDate.get(dateKey) || [];
              const hasInterviews = dayInterviews.length > 0;
              const hasApplications = dayApplications.length > 0;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={dateKey}
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    'relative aspect-square p-1 rounded-lg transition-colors text-sm',
                    'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary',
                    !isCurrentMonth && 'text-muted-foreground/40',
                    isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
                    isCurrentDay && !isSelected && 'ring-2 ring-primary'
                  )}
                >
                  <span className="absolute top-1 left-1/2 -translate-x-1/2">
                    {format(day, 'd')}
                  </span>
                  
                  {/* Indicators */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {hasInterviews && (
                      <div className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isSelected ? 'bg-primary-foreground' : 'bg-status-interview'
                      )} />
                    )}
                    {hasApplications && (
                      <div className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isSelected ? 'bg-primary-foreground' : 'bg-primary'
                      )} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-status-interview" />
              <span>Interview</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Application</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-sm text-muted-foreground">
              Click on a date to see details
            </p>
          ) : selectedInterviews.length === 0 && selectedApplications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No events on this date
            </p>
          ) : (
            <div className="space-y-4">
              {/* Interviews */}
              {selectedInterviews.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Interviews ({selectedInterviews.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedInterviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="p-3 rounded-lg bg-status-interview/10 border border-status-interview/20"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {interviewTypeDisplayMap[interview.type]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(interview.scheduledDate), 'h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{interview.application.jobTitle}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {interview.application.companyName}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Applications */}
              {selectedApplications.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Applied ({selectedApplications.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedApplications.map((app) => (
                      <div
                        key={app.id}
                        className="p-3 rounded-lg bg-secondary/50 border"
                      >
                        <p className="text-sm font-medium">{app.jobTitle}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {app.companyName}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
