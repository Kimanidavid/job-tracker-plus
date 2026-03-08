// Professional resume template catalogue with distinct palettes and layouts

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'minimal' | 'executive' | 'modern';
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    headerBg: string;
    headerText: string;
    bodyText: string;
    subtleText: string;
    divider: string;
    sidebarBg?: string;
    sidebarText?: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    nameSize: string;
    sectionHeadingSize: string;
    bodySize: string;
    lineHeight: string;
  };
  layout: 'single-column' | 'two-column' | 'sidebar-left' | 'sidebar-right' | 'top-header';
  headerStyle: 'centered' | 'left-aligned' | 'bold-bar' | 'underlined' | 'boxed' | 'minimal-line';
  sectionStyle: 'underline' | 'bordered' | 'pill' | 'caps-spaced' | 'bold-line' | 'accent-dot';
  preview: {
    gradient: string;
    thumbnailBg: string;
  };
}

export const resumeTemplates: ResumeTemplate[] = [
  // ─── PROFESSIONAL ─────────────────────────────────
  {
    id: 'corporate-navy',
    name: 'Corporate Navy',
    description: 'Timeless and authoritative — ideal for banking, consulting, and corporate roles',
    category: 'professional',
    palette: {
      primary: '#1a365d',
      secondary: '#2b6cb0',
      accent: '#3182ce',
      headerBg: '#1a365d',
      headerText: '#ffffff',
      bodyText: '#1a202c',
      subtleText: '#718096',
      divider: '#cbd5e0',
    },
    typography: {
      headingFont: "'Georgia', 'Times New Roman', serif",
      bodyFont: "'Cambria', 'Georgia', serif",
      nameSize: '26pt',
      sectionHeadingSize: '13pt',
      bodySize: '10.5pt',
      lineHeight: '1.5',
    },
    layout: 'single-column',
    headerStyle: 'bold-bar',
    sectionStyle: 'underline',
    preview: { gradient: 'linear-gradient(135deg, #1a365d, #2b6cb0)', thumbnailBg: '#edf2f7' },
  },
  {
    id: 'slate-executive',
    name: 'Slate Executive',
    description: 'Sophisticated charcoal tones for senior leadership and executive positions',
    category: 'executive',
    palette: {
      primary: '#2d3748',
      secondary: '#4a5568',
      accent: '#a0aec0',
      headerBg: '#2d3748',
      headerText: '#f7fafc',
      bodyText: '#1a202c',
      subtleText: '#718096',
      divider: '#e2e8f0',
    },
    typography: {
      headingFont: "'Playfair Display', 'Georgia', serif",
      bodyFont: "'Source Sans Pro', 'Helvetica Neue', sans-serif",
      nameSize: '28pt',
      sectionHeadingSize: '12pt',
      bodySize: '10.5pt',
      lineHeight: '1.55',
    },
    layout: 'single-column',
    headerStyle: 'centered',
    sectionStyle: 'caps-spaced',
    preview: { gradient: 'linear-gradient(135deg, #2d3748, #4a5568)', thumbnailBg: '#edf2f7' },
  },
  // ─── MODERN ───────────────────────────────────────
  {
    id: 'electric-blue',
    name: 'Electric Blue',
    description: 'Bold and energetic — perfect for tech, startups, and innovation roles',
    category: 'modern',
    palette: {
      primary: '#2563eb',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      headerBg: '#2563eb',
      headerText: '#ffffff',
      bodyText: '#1e293b',
      subtleText: '#64748b',
      divider: '#dbeafe',
    },
    typography: {
      headingFont: "'Inter', 'SF Pro Display', sans-serif",
      bodyFont: "'Inter', 'Helvetica Neue', sans-serif",
      nameSize: '24pt',
      sectionHeadingSize: '12pt',
      bodySize: '10.5pt',
      lineHeight: '1.5',
    },
    layout: 'single-column',
    headerStyle: 'bold-bar',
    sectionStyle: 'bold-line',
    preview: { gradient: 'linear-gradient(135deg, #2563eb, #60a5fa)', thumbnailBg: '#eff6ff' },
  },
  {
    id: 'teal-fresh',
    name: 'Teal Fresh',
    description: 'Clean and approachable — great for healthcare, education, and non-profit',
    category: 'modern',
    palette: {
      primary: '#0d9488',
      secondary: '#14b8a6',
      accent: '#5eead4',
      headerBg: '#0d9488',
      headerText: '#ffffff',
      bodyText: '#1e293b',
      subtleText: '#64748b',
      divider: '#ccfbf1',
    },
    typography: {
      headingFont: "'Nunito Sans', 'Segoe UI', sans-serif",
      bodyFont: "'Nunito Sans', 'Segoe UI', sans-serif",
      nameSize: '24pt',
      sectionHeadingSize: '12pt',
      bodySize: '10.5pt',
      lineHeight: '1.5',
    },
    layout: 'single-column',
    headerStyle: 'underlined',
    sectionStyle: 'accent-dot',
    preview: { gradient: 'linear-gradient(135deg, #0d9488, #5eead4)', thumbnailBg: '#f0fdfa' },
  },
  // ─── CREATIVE ─────────────────────────────────────
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Creative and distinctive — ideal for design, marketing, and media roles',
    category: 'creative',
    palette: {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      headerBg: '#7c3aed',
      headerText: '#ffffff',
      bodyText: '#1e1b4b',
      subtleText: '#6b7280',
      divider: '#ede9fe',
    },
    typography: {
      headingFont: "'Poppins', 'Segoe UI', sans-serif",
      bodyFont: "'Open Sans', 'Helvetica Neue', sans-serif",
      nameSize: '26pt',
      sectionHeadingSize: '13pt',
      bodySize: '10.5pt',
      lineHeight: '1.5',
    },
    layout: 'single-column',
    headerStyle: 'bold-bar',
    sectionStyle: 'pill',
    preview: { gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)', thumbnailBg: '#f5f3ff' },
  },
  {
    id: 'sunset-coral',
    name: 'Sunset Coral',
    description: 'Warm and inviting — stands out for creative and customer-facing roles',
    category: 'creative',
    palette: {
      primary: '#dc2626',
      secondary: '#ef4444',
      accent: '#f87171',
      headerBg: '#dc2626',
      headerText: '#ffffff',
      bodyText: '#1c1917',
      subtleText: '#78716c',
      divider: '#fecaca',
    },
    typography: {
      headingFont: "'Montserrat', 'Arial', sans-serif",
      bodyFont: "'Lato', 'Helvetica', sans-serif",
      nameSize: '26pt',
      sectionHeadingSize: '12pt',
      bodySize: '10.5pt',
      lineHeight: '1.5',
    },
    layout: 'single-column',
    headerStyle: 'left-aligned',
    sectionStyle: 'bordered',
    preview: { gradient: 'linear-gradient(135deg, #dc2626, #f87171)', thumbnailBg: '#fef2f2' },
  },
  // ─── MINIMAL ──────────────────────────────────────
  {
    id: 'mono-clean',
    name: 'Mono Clean',
    description: 'Ultra-minimal black and white — lets content speak for itself',
    category: 'minimal',
    palette: {
      primary: '#18181b',
      secondary: '#3f3f46',
      accent: '#71717a',
      headerBg: 'transparent',
      headerText: '#18181b',
      bodyText: '#27272a',
      subtleText: '#71717a',
      divider: '#e4e4e7',
    },
    typography: {
      headingFont: "'Inter', 'Helvetica Neue', sans-serif",
      bodyFont: "'Inter', 'Helvetica Neue', sans-serif",
      nameSize: '22pt',
      sectionHeadingSize: '11pt',
      bodySize: '10pt',
      lineHeight: '1.5',
    },
    layout: 'single-column',
    headerStyle: 'minimal-line',
    sectionStyle: 'caps-spaced',
    preview: { gradient: 'linear-gradient(135deg, #18181b, #3f3f46)', thumbnailBg: '#fafafa' },
  },
  {
    id: 'soft-sage',
    name: 'Soft Sage',
    description: 'Calm and refined — a gentle palette for thoughtful, understated applications',
    category: 'minimal',
    palette: {
      primary: '#4d7c0f',
      secondary: '#65a30d',
      accent: '#a3e635',
      headerBg: 'transparent',
      headerText: '#1a2e05',
      bodyText: '#1e293b',
      subtleText: '#64748b',
      divider: '#d9f99d',
    },
    typography: {
      headingFont: "'DM Sans', 'Segoe UI', sans-serif",
      bodyFont: "'DM Sans', 'Segoe UI', sans-serif",
      nameSize: '24pt',
      sectionHeadingSize: '11pt',
      bodySize: '10.5pt',
      lineHeight: '1.55',
    },
    layout: 'single-column',
    headerStyle: 'minimal-line',
    sectionStyle: 'accent-dot',
    preview: { gradient: 'linear-gradient(135deg, #4d7c0f, #a3e635)', thumbnailBg: '#f7fee7' },
  },
  // ─── SIDEBAR LAYOUTS ──────────────────────────────
  {
    id: 'midnight-sidebar',
    name: 'Midnight Sidebar',
    description: 'Two-column layout with a dark sidebar — modern and information-dense',
    category: 'modern',
    palette: {
      primary: '#1e293b',
      secondary: '#334155',
      accent: '#38bdf8',
      headerBg: '#0f172a',
      headerText: '#f1f5f9',
      bodyText: '#1e293b',
      subtleText: '#64748b',
      divider: '#e2e8f0',
      sidebarBg: '#0f172a',
      sidebarText: '#e2e8f0',
    },
    typography: {
      headingFont: "'Inter', 'SF Pro Display', sans-serif",
      bodyFont: "'Inter', 'Helvetica Neue', sans-serif",
      nameSize: '22pt',
      sectionHeadingSize: '11pt',
      bodySize: '10pt',
      lineHeight: '1.5',
    },
    layout: 'sidebar-left',
    headerStyle: 'boxed',
    sectionStyle: 'bold-line',
    preview: { gradient: 'linear-gradient(135deg, #0f172a, #38bdf8)', thumbnailBg: '#f1f5f9' },
  },
  {
    id: 'amber-warm',
    name: 'Amber Warm',
    description: 'Warm golden tones — inviting for hospitality, education, and people-centric roles',
    category: 'professional',
    palette: {
      primary: '#b45309',
      secondary: '#d97706',
      accent: '#fbbf24',
      headerBg: '#b45309',
      headerText: '#fffbeb',
      bodyText: '#1c1917',
      subtleText: '#78716c',
      divider: '#fde68a',
    },
    typography: {
      headingFont: "'Merriweather', 'Georgia', serif",
      bodyFont: "'Source Sans Pro', 'Helvetica', sans-serif",
      nameSize: '24pt',
      sectionHeadingSize: '12pt',
      bodySize: '10.5pt',
      lineHeight: '1.5',
    },
    layout: 'single-column',
    headerStyle: 'bold-bar',
    sectionStyle: 'underline',
    preview: { gradient: 'linear-gradient(135deg, #b45309, #fbbf24)', thumbnailBg: '#fffbeb' },
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
    primaryColor: template.palette.primary,
    fontFamily: template.typography.bodyFont,
    headerStyle: template.headerStyle === 'centered' ? 'centered' as const
      : template.headerStyle === 'bold-bar' ? 'modern' as const
      : 'left' as const,
  };
}
