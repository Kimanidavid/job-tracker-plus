import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  BorderStyle, LevelFormat, HeadingLevel,
} from 'docx';
import type { ResumeSection, ResumeTheme } from '@/components/ResumePreview';
import type { ResumeTemplate, CVPalette } from '@/data/resumeTemplates';

function clean(text: string) { return text.replace(/\*\*/g, '').replace(/\*/g, ''); }
function hex(c: string) { return c.replace('#', ''); }

// Standard resume DOCX:
//  - US Letter (8.5 × 11"), 1" top/bottom, 0.6" left/right margins
//  - Calibri 11pt body, 1.15 line spacing
//  - Name 22pt bold centered, contact line 10pt centered
//  - Section headings 12pt bold uppercase, accent bottom border
export async function exportToDocx(
  sections: ResumeSection[],
  _theme: ResumeTheme,
  fileName = 'resume.docx',
  template?: ResumeTemplate | null,
) {
  const p: CVPalette = template?.palette ?? {
    navy: '#1a365d', midTone: '#2b6cb0', accent: '#3182ce',
    light: '#dbeafe', offWhite: '#f8fafc', darkText: '#1e293b',
    white: '#FFFFFF', steel: '#94a3b8',
  };
  const accent = hex(p.accent);
  const darkText = hex(p.darkText);
  const navy = hex(p.navy);

  const visible = sections.filter(s => s.visible);
  const headerSection = visible.find(s => s.type === 'header');
  const bodySections = visible.filter(s => s.type !== 'header');

  const headerLines = headerSection?.content.split('\n').map(l => l.trim()).filter(Boolean) ?? [];
  const personName = clean(headerLines[0] || 'Your Name');
  const tagline = clean(headerLines[1] || '');
  const contactDetails = headerLines.slice(2).map(clean);

  const para = (children: TextRun[], extra: any = {}) =>
    new Paragraph({ children, spacing: { line: 276 }, ...extra });

  const out: Paragraph[] = [];

  // Name
  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60, line: 276 },
    children: [new TextRun({ text: personName.toUpperCase(), bold: true, size: 44, color: navy, font: 'Calibri' })],
  }));
  if (tagline) {
    out.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60, line: 276 },
      children: [new TextRun({ text: tagline, size: 22, color: darkText, font: 'Calibri', italics: true })],
    }));
  }
  if (contactDetails.length) {
    out.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 276 },
      children: [new TextRun({ text: contactDetails.join('  •  '), size: 20, color: darkText, font: 'Calibri' })],
    }));
  }

  for (const section of bodySections) {
    // Section heading
    out.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80, line: 276 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accent, space: 2 } },
      children: [new TextRun({ text: clean(section.title).toUpperCase(), bold: true, size: 24, color: navy, font: 'Calibri' })],
    }));

    const lines = section.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const raw = clean(lines[i].trim());
      if (!raw) continue;
      const isBullet = /^[-•*▸]/.test(raw);
      const text = isBullet ? raw.replace(/^[-•*▸]\s*/, '') : raw;

      if (isBullet) {
        out.push(new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          spacing: { before: 20, after: 20, line: 276 },
          children: [new TextRun({ text, size: 22, color: darkText, font: 'Calibri' })],
        }));
      } else if (/\b(19|20)\d{2}\b/.test(raw) && raw.length < 110) {
        // Org / date line
        out.push(para([new TextRun({ text, size: 22, color: darkText, font: 'Calibri', italics: true })],
          { spacing: { before: 20, after: 40, line: 276 } }));
      } else if (raw.length < 80 && /^[A-Z]/.test(raw) && i < lines.length - 1) {
        // Subheading (role / school)
        out.push(para([new TextRun({ text, bold: true, size: 22, color: navy, font: 'Calibri' })],
          { spacing: { before: 120, after: 20, line: 276 } }));
      } else {
        out.push(para([new TextRun({ text, size: 22, color: darkText, font: 'Calibri' })],
          { spacing: { before: 40, after: 40, line: 276 } }));
      }
    }
  }

  const doc = new Document({
    creator: 'AgentHire',
    styles: { default: { document: { run: { font: 'Calibri', size: 22, color: darkText } } } },
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 220 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          // US Letter
          size: { width: 12240, height: 15840 },
          // 1" top/bottom, 0.6" left/right
          margin: { top: 1440, bottom: 1440, left: 864, right: 864 },
        },
      },
      children: out,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── PDF Export (html2canvas + jsPDF) ──
// US Letter, 1" top/bottom, 0.6" left/right — sliced for clean page breaks.
export async function exportToPdf(elementId = 'resume-preview', fileName = 'resume.pdf') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Resume preview element not found');

  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  });

  const PAGE_W_MM = 215.9;
  const PAGE_H_MM = 279.4;
  const MARGIN_X_MM = 15.24; // 0.6"
  const MARGIN_Y_MM = 25.4;  // 1"
  const CONTENT_W_MM = PAGE_W_MM - MARGIN_X_MM * 2;
  const CONTENT_H_MM = PAGE_H_MM - MARGIN_Y_MM * 2;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  const pxPerMm = canvas.width / CONTENT_W_MM;
  const sliceHeightPx = Math.floor(CONTENT_H_MM * pxPerMm);
  const totalPages = Math.max(1, Math.ceil(canvas.height / sliceHeightPx));

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const sy = pageIdx * sliceHeightPx;
    const sh = Math.min(sliceHeightPx, canvas.height - sy);

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sh;
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) continue;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
    const sliceHeightMm = sh / pxPerMm;

    if (pageIdx > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', MARGIN_X_MM, MARGIN_Y_MM, CONTENT_W_MM, sliceHeightMm);
  }

  pdf.save(fileName);
}
