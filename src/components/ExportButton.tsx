import { JobApplication, statusDisplayMap, typeDisplayMap, interviewTypeDisplayMap } from '@/types/application';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ExportButtonProps {
  applications: JobApplication[];
}

export function ExportButton({ applications }: ExportButtonProps) {
  const handleExport = () => {
    if (applications.length === 0) return;

    // Build CSV content
    const headers = [
      'Job Title',
      'Company',
      'Company Website',
      'Contact Info',
      'Date Applied',
      'Application Type',
      'Status',
      'Notes',
      'Number of Interviews',
      'Interview Details',
      'Created At',
      'Updated At',
    ];

    const rows = applications.map((app) => {
      const interviewDetails = app.interviews
        .map((i) => {
          const type = interviewTypeDisplayMap[i.type];
          const date = format(parseISO(i.scheduledDate), 'MMM d, yyyy h:mm a');
          const status = i.completed ? 'Completed' : 'Scheduled';
          const interviewer = i.interviewerName ? ` with ${i.interviewerName}` : '';
          return `${type} on ${date}${interviewer} (${status})`;
        })
        .join(' | ');

      return [
        app.jobTitle,
        app.companyName,
        app.companyWebsite || '',
        app.contactInfo || '',
        format(parseISO(app.dateApplied), 'yyyy-MM-dd'),
        typeDisplayMap[app.applicationType],
        statusDisplayMap[app.status],
        app.notes || '',
        app.interviews.length.toString(),
        interviewDetails,
        format(parseISO(app.createdAt), 'yyyy-MM-dd HH:mm'),
        format(parseISO(app.updatedAt), 'yyyy-MM-dd HH:mm'),
      ];
    });

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `job-applications-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport}
      disabled={applications.length === 0}
    >
      <Download className="w-4 h-4 mr-2" />
      Export CSV
    </Button>
  );
}
