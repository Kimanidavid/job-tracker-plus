import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, LevelFormat, WidthType, ShadingType, VerticalAlign
} from 'docx';
import type { ResumeSection, ResumeTheme } from '@/components/ResumePreview';
import type { ResumeTemplate, CVPalette } from '@/data/resumeTemplates';

// ── Helpers to strip '#' from hex colors ──
function hex(color: string) {
  return color.replace('#', '');
}

const PAGE_W = 12240;
const SIDEBAR_W = 3300;
const MAIN_W = PAGE_W - SIDEBAR_W;

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// ── Sidebar helpers ──
function sideLabel(text: string, p: CVPalette) {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 17, color: hex(p.steel), font: 'Calibri' })],
    spacing: { before: 240, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: hex(p.accent), space: 4 } },
  });
}

function sideText(text: string, p: CVPalette, bold = false) {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, color: hex(p.white), font: 'Calibri', bold })],
    spacing: { before: 30, after: 30 },
  });
}

function sideBullet(text: string, p: CVPalette, bulletRef: string) {
  return new Paragraph({
    numbering: { reference: bulletRef, level: 0 },
    children: [new TextRun({ text, size: 18, color: hex(p.white), font: 'Calibri' })],
    spacing: { before: 18, after: 18 },
  });
}

// ── Main helpers ──
function mainSection(text: string, p: CVPalette) {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22, color: hex(p.navy), font: 'Calibri' })],
    spacing: { before: 260, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: hex(p.accent), space: 4 } },
  });
}

function mainBullet(text: string, p: CVPalette, bulletRef: string) {
  return new Paragraph({
    numbering: { reference: bulletRef, level: 0 },
    children: [new TextRun({ text, size: 20, color: hex(p.darkText), font: 'Calibri' })],
    spacing: { before: 20, after: 20 },
  });
}

function mainNormal(text: string, p: CVPalette) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: hex(p.darkText), font: 'Calibri' })],
    spacing: { before: 40, after: 40 },
  });
}

// ── Classify sections for sidebar vs main ──
function isSidebarSection(section: ResumeSection): boolean {
  const t = section.type;
  if (t === 'skills' || t === 'education') return true;
  const title = section.title.toLowerCase();
  return /skill|tool|tech|language|certif|program|annotation|interest/.test(title);
}

// ── Build the two-column DOCX ──
export async function exportToDocx(
  sections: ResumeSection[],
  theme: ResumeTheme,
  fileName = 'resume.docx',
  template?: ResumeTemplate | null,
) {
  const p: CVPalette = template?.palette ?? {
    navy: '#1a365d',
    midTone: '#2b6cb0',
    accent: '#3182ce',
    light: '#dbeafe',
    offWhite: '#f8fafc',
    darkText: '#1e293b',
    white: '#FFFFFF',
    steel: '#94a3b8',
  };

  const visible = sections.filter(s => s.visible);
  const headerSection = visible.find(s => s.type === 'header');
  const sidebarSections = visible.filter(s => s.type !== 'header' && isSidebarSection(s));
  const mainSections = visible.filter(s => s.type !== 'header' && !isSidebarSection(s));

  // Parse header
  const headerLines = headerSection?.content.split('\n').filter(l => l.trim()) ?? [];
  const personName = headerLines[0]?.trim() || 'Your Name';
  const headerDetails = headerLines.slice(1);

  // Build sidebar children
  const sidebarChildren: Paragraph[] = [];
  for (const section of sidebarSections) {
    sidebarChildren.push(sideLabel(section.title, p));
    const lines = section.content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const isBullet = /^[-•*▸]/.test(trimmed);
      if (isBullet) {
        sidebarChildren.push(sideBullet(trimmed.replace(/^[-•*▸]\s*/, ''), p, 'sidebullets'));
      } else {
        sidebarChildren.push(sideText(trimmed, p));
      }
    }
  }

  // Build main children
  const mainChildren: Paragraph[] = [];
  for (const section of mainSections) {
    mainChildren.push(mainSection(section.title, p));
    const lines = section.content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const isBullet = /^[-•*▸]/.test(trimmed);
      if (isBullet) {
        mainChildren.push(mainBullet(trimmed.replace(/^[-•*▸]\s*/, ''), p, 'mainbullets'));
      } else {
        mainChildren.push(mainNormal(trimmed, p));
      }
    }
  }

  // Build the document
  const doc = new Document({
    background: { color: hex(p.offWhite) },
    numbering: {
      config: [
        {
          reference: 'sidebullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '\u25B8', alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 360, hanging: 220 } },
              run: { color: hex(p.accent), bold: true },
            },
          }],
        },
        {
          reference: 'mainbullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '\u25B8', alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 360, hanging: 220 } },
              run: { color: hex(p.accent), bold: true },
            },
          }],
        },
      ],
    },
    styles: {
      default: { document: { run: { font: 'Calibri', size: 20, color: hex(p.darkText) } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_W, height: 15840 },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      children: [
        // ── HEADER BAR ──
        new Table({
          width: { size: PAGE_W, type: WidthType.DXA },
          columnWidths: [PAGE_W],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: PAGE_W, type: WidthType.DXA },
                  shading: { fill: hex(p.navy), type: ShadingType.CLEAR },
                  margins: { top: 440, bottom: 400, left: 600, right: 600 },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: personName.toUpperCase(), bold: true, size: 64, color: hex(p.white), font: 'Calibri' })],
                      spacing: { after: 80 },
                    }),
                    new Paragraph({
                      children: headerDetails.map((line, i) => new TextRun({
                        text: (i > 0 ? '   |   ' : '') + line.trim(),
                        size: i === 0 ? 26 : 22,
                        color: i === 0 ? hex(p.steel) : hex(p.accent),
                        font: 'Calibri',
                        italics: true,
                      })),
                      spacing: { after: 0 },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // ── ACCENT STRIPE ──
        new Table({
          width: { size: PAGE_W, type: WidthType.DXA },
          columnWidths: [PAGE_W],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: PAGE_W, type: WidthType.DXA },
                  shading: { fill: hex(p.accent), type: ShadingType.CLEAR },
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: '', size: 4 })],
                      spacing: { before: 0, after: 0 },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // ── TWO-COLUMN BODY ──
        new Table({
          width: { size: PAGE_W, type: WidthType.DXA },
          columnWidths: [SIDEBAR_W, MAIN_W],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: SIDEBAR_W, type: WidthType.DXA },
                  shading: { fill: hex(p.midTone), type: ShadingType.CLEAR },
                  margins: { top: 320, bottom: 600, left: 300, right: 280 },
                  verticalAlign: VerticalAlign.TOP,
                  children: sidebarChildren.length > 0
                    ? sidebarChildren
                    : [new Paragraph({ children: [new TextRun({ text: ' ', size: 10 })] })],
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: MAIN_W, type: WidthType.DXA },
                  shading: { fill: hex(p.offWhite), type: ShadingType.CLEAR },
                  margins: { top: 180, bottom: 600, left: 380, right: 420 },
                  verticalAlign: VerticalAlign.TOP,
                  children: mainChildren.length > 0
                    ? mainChildren
                    : [new Paragraph({ children: [new TextRun({ text: ' ', size: 10 })] })],
                }),
              ],
            }),
          ],
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
