// Resume templates based on the two uploaded CV styles

export interface CVPalette {
  navy: string;       // header bg & deep accent
  midTone: string;    // sidebar bg & role org color
  accent: string;     // highlights, rules, bullet markers
  light: string;      // tag chips / light bg
  offWhite: string;   // main body bg
  darkText: string;   // body text
  white: string;      // text on dark bg
  steel: string;      // secondary sidebar text / labels
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'minimal' | 'executive' | 'modern';
  palette: CVPalette;
  preview: {
    gradient: string;
    thumbnailBg: string;
  };
  previewImage?: string;
}

export const resumeTemplates: ResumeTemplate[] = [
  {
    id: 'general-cv',
    name: 'General CV',
    description: 'Clean professional layout — ideal for multi-purpose applications, operations, and coordination roles',
    category: 'professional',
    palette: {
      navy: '#0A1F44',
      midTone: '#1A4A8A',
      accent: '#2E7DD1',
      light: '#D6E8FA',
      offWhite: '#F4F8FE',
      darkText: '#0D1B2A',
      white: '#FFFFFF',
      steel: '#B0C8E8',
    },
    preview: { gradient: 'linear-gradient(135deg, #0A1F44, #2E7DD1)', thumbnailBg: '#F4F8FE' },
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Targeted technical layout — optimized for data analysis, engineering, and technical roles',
    category: 'modern',
    palette: {
      navy: '#1B2A4A',
      midTone: '#2C4A7C',
      accent: '#3B82F6',
      light: '#DBEAFE',
      offWhite: '#F8FAFC',
      darkText: '#0F172A',
      white: '#FFFFFF',
      steel: '#94A3B8',
    },
    preview: { gradient: 'linear-gradient(135deg, #1B2A4A, #3B82F6)', thumbnailBg: '#F8FAFC' },
  },
];

export const templateCategories = [
  { id: 'all', label: 'All Templates' },
  { id: 'professional', label: 'Professional' },
  { id: 'modern', label: 'Modern' },
] as const;

export function getTemplateById(id: string): ResumeTemplate | undefined {
  return resumeTemplates.find(t => t.id === id);
}

// Convert a ResumeTemplate to legacy ResumeTheme format for backward compat
export function templateToTheme(template: ResumeTemplate) {
  return {
    id: template.id,
    name: template.name,
    primaryColor: template.palette.accent,
    fontFamily: "'Calibri', 'Helvetica Neue', sans-serif",
    headerStyle: 'modern' as const,
  };
}
