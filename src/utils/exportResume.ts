import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, BorderStyle } from 'docx';
import type { ResumeSection, ResumeTheme } from '@/components/ResumePreview';

// ─── DOCX Export ────────────────────────────────────────────────────────────

export async function exportToDocx(sections: ResumeSection[], theme: ResumeTheme, fileName = 'resume.docx') {
  const visible = sections.filter(s => s.visible);
  const children: Paragraph[] = [];

  for (const section of visible) {
    if (section.type === 'header') {
      const lines = section.content.split('\n').filter(l => l.trim());
      if (lines[0]) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: lines[0].trim(), bold: true, size: 44, color: theme.primaryColor.replace('#', '') })],
            alignment: theme.headerStyle === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: { after: 80 },
          })
        );
      }
      for (let i = 1; i < lines.length; i++) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: lines[i].trim(), size: 20, color: '4B5563' })],
            alignment: theme.headerStyle === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: { after: 40 },
          })
        );
      }
      children.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: theme.primaryColor.replace('#', '') } },
        spacing: { after: 200 },
      }));
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: section.title.toUpperCase(), bold: true, size: 26, color: theme.primaryColor.replace('#', '') })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 80 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: theme.primaryColor.replace('#', '') + '66' } },
        })
      );
      const contentLines = section.content.split('\n');
      for (const line of contentLines) {
        const trimmed = line.trim();
        if (!trimmed) { children.push(new Paragraph({ spacing: { after: 60 } })); continue; }
        const isBullet = /^[-•*]/.test(trimmed);
        children.push(
          new Paragraph({
            children: [new TextRun({ text: isBullet ? trimmed.replace(/^[-•*]\s*/, '') : trimmed, size: 21 })],
            bullet: isBullet ? { level: 0 } : undefined,
            spacing: { after: 40 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1020, right: 1020 } } }, children }],
  });
  const blob = await Packer.toBlob(doc);
  
  // Use native download instead of file-saver
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── PDF Export (html2canvas + jsPDF) ────────────────────────────────────────

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
