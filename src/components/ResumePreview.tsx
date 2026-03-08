import { forwardRef } from 'react';
import type { ResumeTemplate } from '@/data/resumeTemplates';

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

// ─── Rendering helpers ───────────────────────────────────────────────────────

function renderSectionHeading(title: string, template: ResumeTemplate) {
  const { palette, typography, sectionStyle } = template;

  const base: React.CSSProperties = {
    fontSize: typography.sectionHeadingSize,
    fontFamily: typography.headingFont,
    fontWeight: 600,
    color: palette.primary,
    textTransform: 'uppercase',
    marginBottom: '6px',
    paddingBottom: '4px',
    letterSpacing: '1px',
  };

  switch (sectionStyle) {
    case 'underline':
      return <h2 style={{ ...base, borderBottom: `2px solid ${palette.primary}` }}>{title}</h2>;
    case 'bordered':
      return <h2 style={{ ...base, borderLeft: `4px solid ${palette.primary}`, paddingLeft: '10px', borderBottom: 'none' }}>{title}</h2>;
    case 'pill':
      return (
        <h2 style={{
          ...base,
          display: 'inline-block',
          background: palette.primary,
          color: palette.headerText || '#fff',
          padding: '3px 14px',
          borderRadius: '20px',
          fontSize: '10pt',
          marginBottom: '8px',
        }}>
          {title}
        </h2>
      );
    case 'caps-spaced':
      return <h2 style={{ ...base, letterSpacing: '3px', fontSize: '10pt', borderBottom: `1px solid ${palette.divider}` }}>{title}</h2>;
    case 'bold-line':
      return (
        <h2 style={{ ...base, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {title}
          <span style={{ flex: 1, height: '2px', background: palette.accent }} />
        </h2>
      );
    case 'accent-dot':
      return (
        <h2 style={{ ...base, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: palette.primary, flexShrink: 0 }} />
          {title}
        </h2>
      );
    default:
      return <h2 style={{ ...base, borderBottom: `1px solid ${palette.divider}` }}>{title}</h2>;
  }
}

function renderHeader(section: ResumeSection, template: ResumeTemplate) {
  const { palette, typography, headerStyle } = template;
  const lines = section.content.split('\n').filter(l => l.trim());
  const name = lines[0]?.trim() || '';
  const details = lines.slice(1);

  const nameStyle: React.CSSProperties = {
    fontSize: typography.nameSize,
    fontWeight: 700,
    fontFamily: typography.headingFont,
    margin: 0,
    lineHeight: 1.2,
  };

  const detailStyle: React.CSSProperties = {
    fontSize: '10pt',
    margin: '2px 0',
  };

  switch (headerStyle) {
    case 'bold-bar':
      return (
        <div style={{
          background: palette.headerBg,
          color: palette.headerText,
          padding: '20px 24px',
          marginBottom: '16px',
          borderRadius: '0',
        }}>
          <h1 style={{ ...nameStyle, color: palette.headerText, letterSpacing: '1px' }}>{name}</h1>
          {details.map((line, i) => (
            <p key={i} style={{ ...detailStyle, color: `${palette.headerText}cc` }}>{line.trim()}</p>
          ))}
        </div>
      );
    case 'centered':
      return (
        <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: `2px solid ${palette.primary}` }}>
          <h1 style={{ ...nameStyle, color: palette.primary, letterSpacing: '2px' }}>{name}</h1>
          {details.map((line, i) => (
            <p key={i} style={{ ...detailStyle, color: palette.subtleText }}>{line.trim()}</p>
          ))}
        </div>
      );
    case 'underlined':
      return (
        <div style={{ marginBottom: '16px', paddingBottom: '10px', borderBottom: `3px solid ${palette.primary}` }}>
          <h1 style={{ ...nameStyle, color: palette.primary }}>{name}</h1>
          {details.map((line, i) => (
            <p key={i} style={{ ...detailStyle, color: palette.subtleText }}>{line.trim()}</p>
          ))}
        </div>
      );
    case 'boxed':
      return (
        <div style={{
          border: `2px solid ${palette.primary}`,
          padding: '16px 20px',
          marginBottom: '16px',
        }}>
          <h1 style={{ ...nameStyle, color: palette.primary }}>{name}</h1>
          {details.map((line, i) => (
            <p key={i} style={{ ...detailStyle, color: palette.subtleText }}>{line.trim()}</p>
          ))}
        </div>
      );
    case 'minimal-line':
      return (
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ ...nameStyle, color: palette.headerText === 'transparent' ? palette.primary : palette.primary }}>{name}</h1>
          <div style={{ height: '1px', background: palette.divider, margin: '8px 0' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {details.map((line, i) => (
              <span key={i} style={{ fontSize: '9.5pt', color: palette.subtleText }}>{line.trim()}{i < details.length - 1 ? ' · ' : ''}</span>
            ))}
          </div>
        </div>
      );
    default: // left-aligned
      return (
        <div style={{ marginBottom: '16px', paddingBottom: '10px', borderBottom: `2px solid ${palette.primary}` }}>
          <h1 style={{ ...nameStyle, color: palette.primary }}>{name}</h1>
          {details.map((line, i) => (
            <p key={i} style={{ ...detailStyle, color: palette.subtleText }}>{line.trim()}</p>
          ))}
        </div>
      );
  }
}

function renderSectionContent(content: string, template: ResumeTemplate) {
  const { palette, typography } = template;
  return (
    <div style={{ whiteSpace: 'pre-wrap', fontSize: typography.bodySize, color: palette.bodyText, lineHeight: typography.lineHeight, fontFamily: typography.bodyFont }}>
      {content.trim()}
    </div>
  );
}

// ─── Sidebar Layout ──────────────────────────────────────────────────────────

function renderSidebarLayout(sections: ResumeSection[], template: ResumeTemplate) {
  const { palette, typography } = template;
  const headerSection = sections.find(s => s.type === 'header');
  const sidebarTypes: ResumeSection['type'][] = ['skills', 'education'];
  const sidebarSections = sections.filter(s => s.type !== 'header' && sidebarTypes.includes(s.type));
  const mainSections = sections.filter(s => s.type !== 'header' && !sidebarTypes.includes(s.type));

  return (
    <div style={{ display: 'flex', minHeight: '297mm' }}>
      {/* Sidebar */}
      <div style={{
        width: '35%',
        background: palette.sidebarBg || palette.headerBg,
        color: palette.sidebarText || palette.headerText,
        padding: '20px 16px',
        fontFamily: typography.bodyFont,
      }}>
        {headerSection && (
          <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: `1px solid ${palette.accent}40` }}>
            {headerSection.content.split('\n').filter(l => l.trim()).map((line, i) => (
              i === 0 ? (
                <h1 key={i} style={{
                  fontSize: typography.nameSize,
                  fontWeight: 700,
                  fontFamily: typography.headingFont,
                  color: palette.accent,
                  margin: 0,
                  lineHeight: 1.2,
                }}>
                  {line.trim()}
                </h1>
              ) : (
                <p key={i} style={{ fontSize: '9.5pt', color: `${palette.sidebarText || palette.headerText}bb`, margin: '2px 0' }}>{line.trim()}</p>
              )
            ))}
          </div>
        )}
        {sidebarSections.map(section => (
          <div key={section.id} style={{ marginBottom: '16px' }}>
            <h2 style={{
              fontSize: '10pt',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: palette.accent,
              marginBottom: '6px',
              paddingBottom: '4px',
              borderBottom: `1px solid ${palette.accent}40`,
            }}>
              {section.title}
            </h2>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '9.5pt', lineHeight: '1.5', color: palette.sidebarText || palette.headerText }}>
              {section.content.trim()}
            </div>
          </div>
        ))}
      </div>
      {/* Main content */}
      <div style={{ flex: 1, padding: '20px 20px 20px 24px', fontFamily: typography.bodyFont }}>
        {mainSections.map(section => (
          <div key={section.id} style={{ marginBottom: '14px' }}>
            {renderSectionHeading(section.title, template)}
            {renderSectionContent(section.content, template)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props {
  sections: ResumeSection[];
  theme: ResumeTheme;
  customColor?: string;
  template?: ResumeTemplate | null;
}

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ sections, theme, customColor, template }, ref) => {
  const visibleSections = sections.filter(s => s.visible);

  // If a template is provided, use the new rich rendering
  if (template) {
    const isSidebar = template.layout === 'sidebar-left' || template.layout === 'sidebar-right';

    return (
      <div
        ref={ref}
        id="resume-preview"
        className="bg-white text-gray-900 shadow-lg mx-auto"
        style={{
          width: '210mm',
          minHeight: '297mm',
          fontFamily: template.typography.bodyFont,
          fontSize: template.typography.bodySize,
          lineHeight: template.typography.lineHeight,
          overflow: 'hidden',
          ...(isSidebar ? { padding: 0 } : {}),
        }}
      >
        {isSidebar ? (
          renderSidebarLayout(visibleSections, template)
        ) : (
          <div style={{ padding: template.headerStyle === 'bold-bar' ? '0' : '20mm 18mm' }}>
            {visibleSections.map((section) => {
              if (section.type === 'header') {
                return <div key={section.id}>{renderHeader(section, template)}</div>;
              }
              return (
                <div key={section.id} style={{
                  marginBottom: '14px',
                  ...(template.headerStyle === 'bold-bar' && section === visibleSections.find(s => s.type !== 'header')
                    ? { padding: '0 18mm' }
                    : template.headerStyle === 'bold-bar' ? { padding: '0 18mm' } : {}),
                }}>
                  {renderSectionHeading(section.title, template)}
                  {renderSectionContent(section.content, template)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Legacy rendering (backward compat)
  const color = customColor || theme.primaryColor;
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
            <div key={section.id} className="mb-4 pb-3" style={{ borderBottom: `2px solid ${color}`, textAlign: theme.headerStyle === 'centered' ? 'center' : 'left' }}>
              {section.content.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                if (i === 0) {
                  return (
                    <h1 key={i} style={{ color, fontSize: '22pt', fontWeight: 700, margin: 0, letterSpacing: theme.headerStyle === 'modern' ? '2px' : '0.5px', textTransform: theme.headerStyle === 'modern' ? 'uppercase' : 'none' }}>
                      {trimmed}
                    </h1>
                  );
                }
                return <p key={i} style={{ margin: '2px 0', fontSize: '10pt', color: '#4b5563' }}>{trimmed}</p>;
              })}
            </div>
          );
        }
        return (
          <div key={section.id} className="mb-4">
            <h2 style={{ color, fontSize: '13pt', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `1px solid ${color}40`, paddingBottom: '3px', marginBottom: '6px' }}>
              {section.title}
            </h2>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '10.5pt', color: '#1f2937' }}>{section.content.trim()}</div>
          </div>
        );
      })}
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
export default ResumePreview;
