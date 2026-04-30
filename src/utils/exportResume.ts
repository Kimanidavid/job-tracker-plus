import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, LevelFormat, WidthType, ShadingType,
} from 'docx';
import type { ResumeSection, ResumeTheme } from '@/components/ResumePreview';
import type { ResumeTemplate, CVPalette } from '@/data/resumeTemplates';

function hex(color: string) { return color.replace('#', ''); }
function clean(text: string) { return text.replace(/\*\*/g, '').replace(/\*/g, ''); }

const PAGE_W = 12240;
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// ── Paragraph helpers ──
function sectionHeading(text: string, p: CVPalette) {
  return new Paragraph({
    children: [new TextRun({ text: clean(text).toUpperCase(), bold: true, size: 24, color: hex(p.navy), font: 'Calibri' })],
    spacing: { before: 300, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: hex(p.accent), space: 4 } },
  });
}

function subHeading(text: string, p: CVPalette) {
  return new Paragraph({
    children: [new TextRun({ text: clean(text), bold: true, size: 22, color: hex(p.midTone), font: 'Calibri' })],
    spacing: { before: 140, after: 20 },
  });
}

function orgDateLine(text: string, p: CVPalette) {
  return new Paragraph({
    children: [new TextRun({ text: clean(text), size: 20, color: hex(p.accent), font: 'Calibri', bold: true, italics: true })],
    spacing: { before: 0, after: 60 },
  });
}

function bodyBullet(text: string, p: CVPalette, ref: string) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    children: [new TextRun({ text: clean(text), size: 20, color: hex(p.darkText), font: 'Calibri' })],
    spacing: { before: 20, after: 20 },
  });
}

function bodyNormal(text: string, p: CVPalette) {
  return new Paragraph({
    children: [new TextRun({ text: clean(text), size: 20, color: hex(p.darkText), font: 'Calibri' })],
    spacing: { before: 40, after: 40 },
  });
}

// ── Single-column DOCX export ──
export async function exportToDocx(
  sections: ResumeSection[],
  theme: ResumeTheme,
  fileName = 'resume.docx',
  template?: ResumeTemplate | null,
) {
  const p: CVPalette = template?.palette ?? {
    navy: '#1a365d', midTone: '#2b6cb0', accent: '#3182ce',
    light: '#dbeafe', offWhite: '#f8fafc', darkText: '#1e293b',
    white: '#FFFFFF', steel: '#94a3b8',
  };

  const visible = sections.filter(s => s.visible);
  const headerSection = visible.find(s => s.type === 'header');
  const bodySections = visible.filter(s => s.type !== 'header');

  const headerLines = headerSection?.content.split('\n').filter(l => l.trim()) ?? [];
  const personName = clean(headerLines[0]?.trim() || 'Your Name');
  const tagline = clean(headerLines[1]?.trim() || '');
  const contactDetails = headerLines.slice(2).map(l => clean(l.trim()));

  // Build body paragraphs
  const bodyChildren: Paragraph[] = [];
  for (const section of bodySections) {
    bodyChildren.push(sectionHeading(section.title, p));
    const lines = section.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const raw = clean(lines[i].trim());
      if (!raw) continue;
      const isBullet = /^[-•*▸]/.test(raw);
      const text = isBullet ? raw.replace(/^[-•*▸]\s*/, '') : raw;

      if (isBullet) {
        bodyChildren.push(bodyBullet(text, p, 'bullets'));
      } else if (/\b(19|20)\d{2}\b/.test(raw) && raw.length < 100) {
        bodyChildren.push(orgDateLine(text, p));
      } else if (!isBullet && raw.length < 80 && /^[A-Z]/.test(raw) && i < lines.length - 1) {
        bodyChildren.push(subHeading(text, p));
      } else {
        bodyChildren.push(bodyNormal(text, p));
      }
    }
  }

  const doc = new Document({
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u25B8', alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: 360, hanging: 220 } },
            run: { color: hex(p.accent), bold: true },
          },
        }],
      }],
    },
    styles: {
      default: { document: { run: { font: 'Calibri', size: 20, color: hex(p.darkText) } } },
    },
    sections: [{
      properties: {
        page: {
          // US Letter; we use a 0-margin page so the header/stripe can be edge-to-edge.
          // Body padding (1" T/B, 0.6" L/R) is applied via the body cell margins below.
          size: { width: PAGE_W, height: 15840 },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      children: [
        // ── HEADER BAR ──
        new Table({
          width: { size: PAGE_W, type: WidthType.DXA },
          columnWidths: [PAGE_W],
          rows: [new TableRow({
            children: [new TableCell({
              borders: noBorders,
              width: { size: PAGE_W, type: WidthType.DXA },
              shading: { fill: hex(p.navy), type: ShadingType.CLEAR },
              margins: { top: 500, bottom: 400, left: 700, right: 700 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: personName.toUpperCase(), bold: true, size: 60, color: hex(p.white), font: 'Calibri' })],
                  spacing: { after: 60 },
                }),
                ...(tagline ? [new Paragraph({
                  children: [new TextRun({ text: tagline, size: 24, color: hex(p.steel), font: 'Calibri', italics: true })],
                  spacing: { after: 60 },
                })] : []),
                ...(contactDetails.length > 0 ? [new Paragraph({
                  children: contactDetails.flatMap((d, i) => [
                    ...(i > 0 ? [new TextRun({ text: '   |   ', size: 18, color: hex(p.steel), font: 'Calibri' })] : []),
                    new TextRun({ text: d, size: 18, color: hex(p.accent), font: 'Calibri' }),
                  ]),
                  spacing: { after: 0 },
                })] : []),
              ],
            })],
          })],
        }),

        // ── ACCENT STRIPE ──
        new Table({
          width: { size: PAGE_W, type: WidthType.DXA },
          columnWidths: [PAGE_W],
          rows: [new TableRow({
            children: [new TableCell({
              borders: noBorders,
              width: { size: PAGE_W, type: WidthType.DXA },
              shading: { fill: hex(p.accent), type: ShadingType.CLEAR },
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              children: [new Paragraph({ children: [new TextRun({ text: '', size: 4 })], spacing: { before: 0, after: 0 } })],
            })],
          })],
        }),

        // ── BODY (single column with padding) ──
        new Table({
          width: { size: PAGE_W, type: WidthType.DXA },
          columnWidths: [PAGE_W],
          rows: [new TableRow({
            children: [new TableCell({
              borders: noBorders,
              width: { size: PAGE_W, type: WidthType.DXA },
              shading: { fill: hex(p.white), type: ShadingType.CLEAR },
              // Body content padding: 1" top/bottom (1440 DXA), 0.6" left/right (864 DXA)
              margins: { top: 1440, bottom: 1440, left: 864, right: 864 },
              children: bodyChildren.length > 0
                ? bodyChildren
                : [new Paragraph({ children: [new TextRun({ text: ' ', size: 10 })] })],
            })],
          })],
        }),
      ],
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
// Renders the resume preview onto US Letter pages with margins:
//   top/bottom: 1"   (25.4mm)
//   left/right: 0.6" (15.24mm)
// Uses canvas slicing so text isn't stretched and pages break cleanly.
export async function exportToPdf(elementId = 'resume-preview', fileName = 'resume.pdf') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Resume preview element not found');

  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  // Render at high DPI for sharp text
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  });

  // US Letter in mm
  const PAGE_W_MM = 215.9;
  const PAGE_H_MM = 279.4;
  const MARGIN_X_MM = 15.24; // 0.6"
  const MARGIN_Y_MM = 25.4;  // 1"
  const CONTENT_W_MM = PAGE_W_MM - MARGIN_X_MM * 2; // 185.42mm
  const CONTENT_H_MM = PAGE_H_MM - MARGIN_Y_MM * 2; // 228.6mm

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  // Map canvas pixels → mm using full image scaled to content width
  const pxPerMm = canvas.width / CONTENT_W_MM;
  const sliceHeightPx = Math.floor(CONTENT_H_MM * pxPerMm);
  const totalPages = Math.max(1, Math.ceil(canvas.height / sliceHeightPx));

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const sy = pageIdx * sliceHeightPx;
    const sh = Math.min(sliceHeightPx, canvas.height - sy);

    // Create a per-page canvas slice
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
    pdf.addImage(
      imgData,
      'JPEG',
      MARGIN_X_MM,
      MARGIN_Y_MM,
      CONTENT_W_MM,
      sliceHeightMm,
    );
  }

  pdf.save(fileName);
}

