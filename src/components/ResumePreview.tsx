import { forwardRef } from 'react';
import type { ResumeTemplate, CVPalette } from '@/data/resumeTemplates';

export interface ResumeSection {
  id: string;
  type: 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'custom';
  title: string;
  content: string;
  visible: boolean;
}

// Legacy theme type kept for backward compat
export interface ResumeTheme {
  id: string;
  name: string;
  primaryColor: string;
  fontFamily: string;
  headerStyle: 'centered' | 'left' | 'modern';
}

export const defaultThemes: ResumeTheme[] = [
  { id: 'classic', name: 'Classic', primaryColor: '#1a365d', fontFamily: "'Georgia', serif", headerStyle: 'left' },
  { id: 'modern', name: 'Modern', primaryColor: '#2563eb', fontFamily: "'Inter', sans-serif", headerStyle: 'modern' },
];

export function parseResumeToSections(content: string): ResumeSection[] {
  if (!content.trim()) return [];
  const lines = content.split('\n');
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  let headerLines: string[] = [];
  let foundFirstSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isSectionHeader = /^(SUMMARY|OBJECTIVE|EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|PROFESSIONAL PROFILE|EDUCATION|SKILLS|TECHNICAL SKILLS|PROJECTS|CERTIFICATIONS|AWARDS|LANGUAGES|INTERESTS|REFERENCES|VOLUNTEER|PUBLICATIONS|PROGRAMMING|WEB TECHNOLOGIES|ANNOTATION|SPECIALISATIONS|SPECIALIZATIONS|KEY STRENGTHS|MACHINE LEARNING|CONTACT)/i.test(trimmed)
      || (trimmed.length > 2 && trimmed.length < 40 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && !trimmed.match(/^\d/));

    if (isSectionHeader) {
      if (currentSection) sections.push(currentSection);
      if (!foundFirstSection && headerLines.length > 0) {
        sections.push({
          id: 'header',
          type: 'header',
          title: 'Contact Info',
          content: headerLines.join('\n'),
          visible: true,
        });
      }
      foundFirstSection = true;
      const type = detectSectionType(trimmed);
      currentSection = {
        id: crypto.randomUUID(),
        type,
        title: trimmed.replace(/[:—-]+$/, '').trim(),
        content: '',
        visible: true,
      };
    } else if (!foundFirstSection) {
      headerLines.push(line);
    } else if (currentSection) {
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  }
  if (currentSection) sections.push(currentSection);
  if (sections.length === 0 && content.trim()) {
    sections.push({ id: 'full', type: 'custom', title: 'Resume', content, visible: true });
  }
  return sections;
}

function detectSectionType(header: string): ResumeSection['type'] {
  const h = header.toLowerCase();
  if (/summary|objective|profile|about/.test(h)) return 'summary';
  if (/experience|work|employment|history/.test(h)) return 'experience';
  if (/education|academic|degree/.test(h)) return 'education';
  if (/skill|technical|competenc|tool|programming|web tech|annotation|special/.test(h)) return 'skills';
  return 'custom';
}

function isSidebarSection(section: ResumeSection): boolean {
  if (section.type === 'skills' || section.type === 'education') return true;
  const title = section.title.toLowerCase();
  return /skill|tool|tech|language|certif|program|annotation|interest|special|contact/.test(title);
}

// ── Render content lines with bullet detection ──
function ContentLines({ content, palette, isSidebar }: { content: string; palette: CVPalette; isSidebar?: boolean }) {
  const lines = content.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const isBullet = /^[-•*▸]/.test(trimmed);
        const text = isBullet ? trimmed.replace(/^[-•*▸]\s*/, '') : trimmed;
        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            marginBottom: '3px',
            fontSize: isSidebar ? '9pt' : '10pt',
            color: isSidebar ? palette.white : palette.darkText,
            lineHeight: '1.5',
          }}>
            {isBullet && (
              <span style={{ color: palette.accent, fontWeight: 700, fontSize: '8pt', marginTop: '2px', flexShrink: 0 }}>▸</span>
            )}
            <span>{text}</span>
          </div>
        );
      })}
    </>
  );
}

// ── Main Component ──
interface Props {
  sections: ResumeSection[];
  theme: ResumeTheme;
  customColor?: string;
  template?: ResumeTemplate | null;
}

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ sections, theme, customColor, template }, ref) => {
  const visibleSections = sections.filter(s => s.visible);

  // Default palette if no template
  const p: CVPalette = template?.palette ?? {
    navy: '#0A1F44',
    midTone: '#1A4A8A',
    accent: customColor || theme.primaryColor || '#2E7DD1',
    light: '#D6E8FA',
    offWhite: '#F4F8FE',
    darkText: '#0D1B2A',
    white: '#FFFFFF',
    steel: '#B0C8E8',
  };

  const headerSection = visibleSections.find(s => s.type === 'header');
  const sidebarSections = visibleSections.filter(s => s.type !== 'header' && isSidebarSection(s));
  const mainSections = visibleSections.filter(s => s.type !== 'header' && !isSidebarSection(s));

  const headerLines = headerSection?.content.split('\n').filter(l => l.trim()) ?? [];
  const personName = headerLines[0]?.trim() || 'Your Name';
  const headerDetails = headerLines.slice(1);

  return (
    <div
      ref={ref}
      id="resume-preview"
      style={{
        width: '210mm',
        minHeight: '297mm',
        fontFamily: "'Calibri', 'Helvetica Neue', sans-serif",
        fontSize: '10pt',
        lineHeight: '1.5',
        overflow: 'hidden',
        background: p.offWhite,
      }}
    >
      {/* ── HEADER BAR ── */}
      <div style={{
        background: p.navy,
        padding: '28px 36px',
        color: p.white,
      }}>
        <h1 style={{
          fontSize: '28pt',
          fontWeight: 700,
          margin: 0,
          letterSpacing: '2px',
          color: p.white,
          textTransform: 'uppercase',
        }}>
          {personName}
        </h1>
        {headerDetails.length > 0 && (
          <div style={{ marginTop: '6px' }}>
            {headerDetails.map((line, i) => (
              <span key={i} style={{
                fontSize: i === 0 ? '12pt' : '10pt',
                color: i === 0 ? p.steel : p.accent,
                fontStyle: 'italic',
              }}>
                {i > 0 && <span style={{ margin: '0 8px', color: p.steel }}>|</span>}
                {line.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── ACCENT STRIPE ── */}
      <div style={{ height: '4px', background: p.accent }} />

      {/* ── TWO-COLUMN BODY ── */}
      <div style={{ display: 'flex', minHeight: 'calc(297mm - 100px)' }}>
        {/* Sidebar */}
        <div style={{
          width: '27%',
          background: p.midTone,
          padding: '20px 16px',
          color: p.white,
          flexShrink: 0,
        }}>
          {sidebarSections.map(section => (
            <div key={section.id} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '8.5pt',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: p.steel,
                letterSpacing: '1px',
                paddingBottom: '4px',
                marginBottom: '8px',
                borderBottom: `2px solid ${p.accent}`,
              }}>
                {section.title}
              </div>
              <ContentLines content={section.content} palette={p} isSidebar />
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{
          flex: 1,
          padding: '16px 24px 24px 28px',
          background: p.offWhite,
        }}>
          {mainSections.map(section => (
            <div key={section.id} style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '11pt',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: p.navy,
                letterSpacing: '1px',
                paddingBottom: '4px',
                marginBottom: '8px',
                borderBottom: `3px solid ${p.accent}`,
              }}>
                {section.title}
              </div>
              <ContentLines content={section.content} palette={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
export default ResumePreview;
