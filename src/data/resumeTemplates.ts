// Professional CV templates based on two-column sidebar layout
// Each template defines a color palette that maps to: header bar, accent stripe, sidebar, main body

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
}

export const resumeTemplates: ResumeTemplate[] = [
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Classic navy and blue — ideal for corporate, tech, and consulting roles',
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
    id: 'slate-executive',
    name: 'Slate Executive',
    description: 'Sophisticated charcoal — for senior leadership and executive positions',
    category: 'executive',
    palette: {
      navy: '#1C1C2E',
      midTone: '#2D2D44',
      accent: '#8B8BAE',
      light: '#E8E8F0',
      offWhite: '#F8F8FC',
      darkText: '#1A1A2E',
      white: '#FFFFFF',
      steel: '#A0A0B8',
    },
    preview: { gradient: 'linear-gradient(135deg, #1C1C2E, #8B8BAE)', thumbnailBg: '#F8F8FC' },
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Earthy and grounded — great for finance, sustainability, and non-profit',
    category: 'professional',
    palette: {
      navy: '#0B2818',
      midTone: '#1A5632',
      accent: '#2E9B5A',
      light: '#D4F0E0',
      offWhite: '#F4FAF6',
      darkText: '#0D1F14',
      white: '#FFFFFF',
      steel: '#8CC4A0',
    },
    preview: { gradient: 'linear-gradient(135deg, #0B2818, #2E9B5A)', thumbnailBg: '#F4FAF6' },
  },
  {
    id: 'crimson-bold',
    name: 'Crimson Bold',
    description: 'Warm and confident — stands out for marketing, media, and sales roles',
    category: 'creative',
    palette: {
      navy: '#3B0A0A',
      midTone: '#7A1A1A',
      accent: '#D13B3B',
      light: '#FAD6D6',
      offWhite: '#FEF4F4',
      darkText: '#2A0D0D',
      white: '#FFFFFF',
      steel: '#E8A0A0',
    },
    preview: { gradient: 'linear-gradient(135deg, #3B0A0A, #D13B3B)', thumbnailBg: '#FEF4F4' },
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Creative and distinctive — ideal for design, arts, and innovation roles',
    category: 'creative',
    palette: {
      navy: '#1A0A3B',
      midTone: '#3A1A7A',
      accent: '#7B3BD1',
      light: '#E0D6FA',
      offWhite: '#F8F4FE',
      darkText: '#1B0D2A',
      white: '#FFFFFF',
      steel: '#B8A0E8',
    },
    preview: { gradient: 'linear-gradient(135deg, #1A0A3B, #7B3BD1)', thumbnailBg: '#F8F4FE' },
  },
  {
    id: 'teal-fresh',
    name: 'Teal Fresh',
    description: 'Clean and modern — perfect for healthcare, education, and startups',
    category: 'modern',
    palette: {
      navy: '#0A2E2E',
      midTone: '#1A5A5A',
      accent: '#2EB8A6',
      light: '#D6FAF4',
      offWhite: '#F4FEFA',
      darkText: '#0D2A26',
      white: '#FFFFFF',
      steel: '#8CE0D0',
    },
    preview: { gradient: 'linear-gradient(135deg, #0A2E2E, #2EB8A6)', thumbnailBg: '#F4FEFA' },
  },
  {
    id: 'amber-warm',
    name: 'Amber Warm',
    description: 'Warm golden tones — inviting for hospitality, education, and people roles',
    category: 'professional',
    palette: {
      navy: '#2E1A0A',
      midTone: '#6B3A0F',
      accent: '#D18B2E',
      light: '#FAE8D6',
      offWhite: '#FEF8F4',
      darkText: '#2A1B0D',
      white: '#FFFFFF',
      steel: '#E8C8A0',
    },
    preview: { gradient: 'linear-gradient(135deg, #2E1A0A, #D18B2E)', thumbnailBg: '#FEF8F4' },
  },
  {
    id: 'mono-clean',
    name: 'Mono Clean',
    description: 'Ultra-minimal black and white — lets your content speak for itself',
    category: 'minimal',
    palette: {
      navy: '#111111',
      midTone: '#2A2A2A',
      accent: '#555555',
      light: '#E5E5E5',
      offWhite: '#FAFAFA',
      darkText: '#111111',
      white: '#FFFFFF',
      steel: '#999999',
    },
    preview: { gradient: 'linear-gradient(135deg, #111111, #555555)', thumbnailBg: '#FAFAFA' },
  },
  {
    id: 'midnight-indigo',
    name: 'Midnight Indigo',
    description: 'Deep and striking — tech-forward for engineering and data science roles',
    category: 'modern',
    palette: {
      navy: '#0F1B3D',
      midTone: '#1E3A6E',
      accent: '#4A90D9',
      light: '#D4E4F8',
      offWhite: '#F2F6FC',
      darkText: '#0D1B2A',
      white: '#FFFFFF',
      steel: '#8EB4DE',
    },
    preview: { gradient: 'linear-gradient(135deg, #0F1B3D, #4A90D9)', thumbnailBg: '#F2F6FC' },
  },
  {
    id: 'sage-earth',
    name: 'Sage Earth',
    description: 'Calm and refined — a gentle palette for thoughtful, understated applications',
    category: 'minimal',
    palette: {
      navy: '#1A2E1A',
      midTone: '#3A5A3A',
      accent: '#6B9B6B',
      light: '#D9ECD9',
      offWhite: '#F5FAF5',
      darkText: '#1A2A1A',
      white: '#FFFFFF',
      steel: '#A0C8A0',
    },
    preview: { gradient: 'linear-gradient(135deg, #1A2E1A, #6B9B6B)', thumbnailBg: '#F5FAF5' },
  },
];

export const templateCategories = [
  { id: 'all', label: 'All Templates' },
  { id: 'professional', label: 'Professional' },
  { id: 'modern', label: 'Modern' },
  { id: 'creative', label: 'Creative' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'executive', label: 'Executive' },
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
