// Server-side DOCX CV generator — standard single-column format.
// US Letter, 1" top/bottom, 0.6" left/right, Calibri 11pt, 1.15 line spacing.
// POST { sections, palette?, fileName? } → .docx attachment.

import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, BorderStyle, LevelFormat, HeadingLevel,
} from "npm:docx@8.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Palette = { navy: string; accent: string; darkText: string };
type Section = {
  type: "header" | "summary" | "experience" | "education" | "skills" | "custom";
  title: string;
  content: string;
  visible?: boolean;
};

const DEFAULT_PALETTE: Palette = { navy: "#1a365d", accent: "#3182ce", darkText: "#1e293b" };
const hex = (c: string) => c.replace("#", "");
const clean = (t: string) => (t || "").replace(/\*\*/g, "").replace(/\*/g, "");

function build(sections: Section[], palette: Palette): Document {
  const navy = hex(palette.navy);
  const accent = hex(palette.accent);
  const darkText = hex(palette.darkText);

  const visible = sections.filter(s => s.visible !== false);
  const header = visible.find(s => s.type === "header");
  const body = visible.filter(s => s.type !== "header");

  const headerLines = (header?.content ?? "").split("\n").map(l => l.trim()).filter(Boolean);
  const name = clean(headerLines[0] || "Your Name");
  const tagline = clean(headerLines[1] || "");
  const contact = headerLines.slice(2).map(clean);

  const out: Paragraph[] = [];

  out.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60, line: 276 },
    children: [new TextRun({ text: name.toUpperCase(), bold: true, size: 44, color: navy, font: "Calibri" })],
  }));
  if (tagline) out.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 60, line: 276 },
    children: [new TextRun({ text: tagline, size: 22, color: darkText, font: "Calibri", italics: true })],
  }));
  if (contact.length) out.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 200, line: 276 },
    children: [new TextRun({ text: contact.join("  •  "), size: 20, color: darkText, font: "Calibri" })],
  }));

  for (const section of body) {
    out.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80, line: 276 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accent, space: 2 } },
      children: [new TextRun({ text: clean(section.title).toUpperCase(), bold: true, size: 24, color: navy, font: "Calibri" })],
    }));
    const lines = section.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const raw = clean(lines[i].trim());
      if (!raw) continue;
      const isBullet = /^[-•*▸]/.test(raw);
      const text = isBullet ? raw.replace(/^[-•*▸]\s*/, "") : raw;
      if (isBullet) {
        out.push(new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { before: 20, after: 20, line: 276 },
          children: [new TextRun({ text, size: 22, color: darkText, font: "Calibri" })],
        }));
      } else if (/\b(19|20)\d{2}\b/.test(raw) && raw.length < 110) {
        out.push(new Paragraph({
          spacing: { before: 20, after: 40, line: 276 },
          children: [new TextRun({ text, size: 22, color: darkText, font: "Calibri", italics: true })],
        }));
      } else if (raw.length < 80 && /^[A-Z]/.test(raw) && i < lines.length - 1) {
        out.push(new Paragraph({
          spacing: { before: 120, after: 20, line: 276 },
          children: [new TextRun({ text, bold: true, size: 22, color: navy, font: "Calibri" })],
        }));
      } else {
        out.push(new Paragraph({
          spacing: { before: 40, after: 40, line: 276 },
          children: [new TextRun({ text, size: 22, color: darkText, font: "Calibri" })],
        }));
      }
    }
  }

  return new Document({
    creator: "AgentHire",
    styles: { default: { document: { run: { font: "Calibri", size: 22, color: darkText } } } },
    numbering: {
      config: [{
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 220 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, bottom: 1440, left: 864, right: 864 },
        },
      },
      children: out,
    }],
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { sections, palette, fileName } = await req.json();
    if (!Array.isArray(sections)) {
      return new Response(JSON.stringify({ error: "sections must be an array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const doc = build(sections as Section[], { ...DEFAULT_PALETTE, ...(palette || {}) });
    const buffer = await Packer.toBuffer(doc);
    return new Response(buffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${(fileName || "cv").replace(/[^\w.-]+/g, "_")}.docx"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
