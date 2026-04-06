import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, LevelFormat, WidthType, ShadingType,
} from 'docx';
import type { ResumeSection, ResumeTheme, CVPalette } from '@/components/ResumePreview';

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
  palette?: CVPalette | null,
) {
  const p: CVPalette = palette ?? {
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
          size: { width: PAGE_W, height: 15840 },
          margin: { top: 0, right: 0, bottom: 400, left: 0 },
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
              margins: { top: 200, bottom: 400, left: 700, right: 700 },
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
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let position = 0;
  let remaining = imgHeight;
  while (remaining > 0) {
    if (position > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
    position += pdfHeight;
    remaining -= pdfHeight;
  }
  pdf.save(fileName);
}
