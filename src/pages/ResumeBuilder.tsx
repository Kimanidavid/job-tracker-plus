import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function ResumeBuilder() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Resume Builder</h1>
        <p className="text-muted-foreground">Paste a job description and let AI tailor your resume</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            AI-powered resume tailoring with ATS keyword optimization, achievement bullets, skill recommendations, and 6 visual templates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
