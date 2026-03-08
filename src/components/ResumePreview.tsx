import { forwardRef } from 'react';

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
  { id: 'elegant', name: 'Elegant', primaryColor: '#7c3aed', fontFamily: "'Playfair Display', serif", headerStyle: 'centered' },
  { id: 'bold', name: 'Bold', primaryColor: '#dc2626', fontFamily: "'Montserrat', sans-serif", headerStyle: 'left' },
  { id: 'minimal', name: 'Minimal', primaryColor: '#374151', fontFamily: "'Inter', sans-serif", headerStyle: 'left' },
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
    // Detect section headers (ALL CAPS lines, or lines with common headers)
    const isSectionHeader = /^(SUMMARY|OBJECTIVE|EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EDUCATION|SKILLS|TECHNICAL SKILLS|PROJECTS|CERTIFICATIONS|AWARDS|LANGUAGES|INTERESTS|REFERENCES|VOLUNTEER|PUBLICATIONS)/i.test(trimmed)
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
  if (/skill|technical|competenc|tool/.test(h)) return 'skills';
  return 'custom';
}

interface Props {
  sections: ResumeSection[];
  theme: ResumeTheme;
  customColor?: string;
}

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ sections, theme, customColor }, ref) => {
  const color = customColor || theme.primaryColor;
  const visibleSections = sections.filter(s => s.visible);

  return (
    <div
      ref={ref}
      id="resume-preview"
      className="bg-white text-gray-900 shadow-lg mx-auto"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm 18mm',
        fontFamily: theme.fontFamily,
        fontSize: '11pt',
        lineHeight: '1.5',
      }}
    >
      {visibleSections.map((section) => {
        if (section.type === 'header') {
          return (
            <div
              key={section.id}
              className="mb-4 pb-3"
              style={{
                borderBottom: `2px solid ${color}`,
                textAlign: theme.headerStyle === 'centered' ? 'center' : 'left',
              }}
            >
              {section.content.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                if (i === 0) {
                  return (
                    <h1
                      key={i}
                      style={{
                        color,
                        fontSize: '22pt',
                        fontWeight: 700,
                        margin: 0,
                        letterSpacing: theme.headerStyle === 'modern' ? '2px' : '0.5px',
                        textTransform: theme.headerStyle === 'modern' ? 'uppercase' : 'none',
                      }}
                    >
                      {trimmed}
                    </h1>
                  );
                }
                return (
                  <p key={i} style={{ margin: '2px 0', fontSize: '10pt', color: '#4b5563' }}>
                    {trimmed}
                  </p>
                );
              })}
            </div>
          );
        }

        return (
          <div key={section.id} className="mb-4">
            <h2
              style={{
                color,
                fontSize: '13pt',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                borderBottom: `1px solid ${color}40`,
                paddingBottom: '3px',
                marginBottom: '6px',
              }}
            >
              {section.title}
            </h2>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '10.5pt', color: '#1f2937' }}>
              {section.content.trim()}
            </div>
          </div>
        );
      })}
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
export default ResumePreview;
