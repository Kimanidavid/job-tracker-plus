import { forwardRef } from 'react';
import type { ResumeTemplate, CVPalette } from '@/data/resumeTemplates';

export interface ResumeSection {
  id: string;
  type: 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'custom';
  title: string;
  content: string;
  visible: boolean;
}

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
        title: cleanTitle(trimmed),
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

/** Strip asterisks, colons, dashes from titles and title-case them */
function cleanTitle(raw: string): string {
  const stripped = raw.replace(/[*_#]+/g, '').replace(/[:—-]+$/, '').trim();
  // Title case: capitalize first letter of each word
  return stripped
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function detectSectionType(header: string): ResumeSection['type'] {
  const h = header.toLowerCase();
  if (/summary|objective|profile|about/.test(h)) return 'summary';
  if (/experience|work|employment|history/.test(h)) return 'experience';
  if (/education|academic|degree/.test(h)) return 'education';
  if (/skill|technical|competenc|tool|programming|web tech|annotation|special/.test(h)) return 'skills';
  return 'custom';
}

/** Clean asterisks and markdown bold from content lines */
function cleanContent(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\*/g, '');
}

// ── Render content lines with bullet detection & sub-heading detection ──
function ContentLines({ content, palette }: { content: string; palette: CVPalette }) {
  const lines = content.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const raw = cleanContent(line.trim());
        if (!raw) return null;

        const isBullet = /^[-•▸]/.test(raw);
        const text = isBullet ? raw.replace(/^[-•▸]\s*/, '') : raw;

        // Detect sub-headings: role titles (short, no bullet, followed by org/dates)
        const isSubHeading = !isBullet && raw.length < 80 && /^[A-Z]/.test(raw) &&
          (raw.includes('—') || raw.includes('–') || /^\w[\w\s]+$/.test(raw)) &&
          i < lines.length - 1;

        // Detect org/date lines (contains year pattern)
        const isOrgDate = !isBullet && /\b(19|20)\d{2}\b/.test(raw) && raw.length < 100;

        if (isSubHeading && !isOrgDate) {
          return (
            <div key={i} style={{
              fontSize: '11pt',
              fontWeight: 700,
              color: palette.midTone,
              marginTop: i > 0 ? '10px' : '0',
              marginBottom: '2px',
              lineHeight: '1.4',
            }}>
              {text}
            </div>
          );
        }

        if (isOrgDate) {
          return (
            <div key={i} style={{
              fontSize: '10pt',
              color: palette.accent,
              fontWeight: 600,
              fontStyle: 'italic',
              marginBottom: '4px',
              lineHeight: '1.4',
            }}>
              {text}
            </div>
          );
        }

        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '3px',
            fontSize: '10pt',
            color: palette.darkText,
            lineHeight: '1.55',
          }}>
            {isBullet && (
              <span style={{ color: palette.accent, fontWeight: 700, fontSize: '9pt', marginTop: '2px', flexShrink: 0 }}>▸</span>
            )}
            <span>{text}</span>
          </div>
        );
      })}
    </>
  );
}

// ── Main Component — Single Column Layout ──
interface Props {
  sections: ResumeSection[];
  theme: ResumeTheme;
  customColor?: string;
  template?: ResumeTemplate | null;
  highlightedSectionIds?: string[];
}

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ sections, theme, customColor, template, highlightedSectionIds }, ref) => {
  const visibleSections = sections.filter(s => s.visible);
  const highlightSet = new Set(highlightedSectionIds || []);

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
  const bodySections = visibleSections.filter(s => s.type !== 'header');

  const headerLines = headerSection?.content.split('\n').filter(l => l.trim()) ?? [];
  const personName = cleanContent(headerLines[0]?.trim() || '');
  const tagline = cleanContent(headerLines[1]?.trim() || '');
  const contactDetails = headerLines.slice(2).map(l => cleanContent(l.trim()));

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
        background: p.white,
      }}
    >
      {/* ── HEADER ── */}
      <div style={{
        background: p.navy,
        padding: '32px 44px 24px',
        color: p.white,
      }}>
        <h1 style={{
          fontSize: '30pt',
          fontWeight: 700,
          margin: 0,
          letterSpacing: '2.5px',
          color: p.white,
          textTransform: 'uppercase',
        }}>
          {personName}
        </h1>
        {tagline && (
          <div style={{
            fontSize: '12pt',
            color: p.steel,
            fontStyle: 'italic',
            marginTop: '4px',
            letterSpacing: '0.5px',
          }}>
            {tagline}
          </div>
        )}
        {contactDetails.length > 0 && (
          <div style={{
            marginTop: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px 16px',
          }}>
            {contactDetails.map((line, i) => (
              <span key={i} style={{
                fontSize: '9.5pt',
                color: p.accent,
              }}>
                {line}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── ACCENT STRIPE ── */}
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${p.accent}, ${p.midTone})` }} />

      {/* ── SINGLE COLUMN BODY ── */}
      <div style={{
        padding: '24px 44px 40px',
        background: p.white,
      }}>
        {bodySections.map(section => (
          <div key={section.id} style={{ marginBottom: '18px' }}>
            {/* Section heading */}
            <div style={{
              fontSize: '12pt',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: p.navy,
              letterSpacing: '1.5px',
              paddingBottom: '5px',
              marginBottom: '10px',
              borderBottom: `3px solid ${p.accent}`,
            }}>
              {cleanContent(section.title)}
            </div>
            <ContentLines content={section.content} palette={p} />
          </div>
        ))}
      </div>
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
export default ResumePreview;
