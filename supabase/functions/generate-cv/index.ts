// Server-side DOCX CV generator (Deno port of client exportToDocx).
// Mirrors the Express snippet: POST { sections, theme?, template?, fileName? }
// → returns a .docx attachment.
//
// Margins:
//   page: 0 (so header bar/accent stripe can be edge-to-edge)
//   body content padding: 1" top/bottom (1440 DXA), 0.6" left/right (864 DXA)

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, LevelFormat, WidthType, ShadingType,
} from "npm:docx@8.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Palette = {
  navy: string; midTone: string; accent: string;
  light: string; offWhite: string; darkText: string;
  white: string; steel: string;
};

type Section = {
  id?: string;
  type: "header" | "summary" | "experience" | "education" | "skills" | "custom";
  title: string;
  content: string;
  visible?: boolean;
};

const DEFAULT_PALETTE: Palette = {
  navy: "#1a365d", midTone: "#2b6cb0", accent: "#3182ce",
  light: "#dbeafe", offWhite: "#f8fafc", darkText: "#1e293b",
  white: "#FFFFFF", steel: "#94a3b8",
};

const PAGE_W = 12240;
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

const hex = (c: string) => c.replace("#", "");
const clean = (t: string) => (t || "").replace(/\*\*/g, "").replace(/\*/g, "");

function sectionHeading(text: string, p: Palette) {
  return new Paragraph({
    children: [new TextRun({ text: clean(text).toUpperCase(), bold: true, size: 24, color: hex(p.navy), font: "Calibri" })],
    spacing: { before: 300, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: hex(p.accent), space: 4 } },
  });
}
function subHeading(text: string, p: Palette) {
  return new Paragraph({
    children: [new TextRun({ text: clean(text), bold: true, size: 22, color: hex(p.midTone), font: "Calibri" })],
    spacing: { before: 140, after: 20 },
  });
}
function orgDateLine(text: string, p: Palette) {
  return new Paragraph({
    children: [new TextRun({ text: clean(text), size: 20, color: hex(p.accent), font: "Calibri", bold: true, italics: true })],
    spacing: { before: 0, after: 60 },
  });
}
function bodyBullet(text: string, p: Palette, ref: string) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    children: [new TextRun({ text: clean(text), size: 20, color: hex(p.darkText), font: "Calibri" })],
    spacing: { before: 20, after: 20 },
  });
}
function bodyNormal(text: string, p: Palette) {
  return new Paragraph({
    children: [new TextRun({ text: clean(text), size: 20, color: hex(p.darkText), font: "Calibri" })],
    spacing: { before: 40, after: 40 },
  });
}

export async function generateCV(opts: {
  sections: Section[];
  palette?: Palette;
  fileName?: string;
}): Promise<Uint8Array> {
  const p = opts.palette ?? DEFAULT_PALETTE;
  const visible = (opts.sections || []).filter((s) => s.visible !== false);
  const headerSection = visible.find((s) => s.type === "header");
  const bodySections = visible.filter((s) => s.type !== "header");

  const headerLines = (headerSection?.content || "").split("\n").filter((l) => l.trim());
  const personName = clean(headerLines[0]?.trim() || "Your Name");
  const tagline = clean(headerLines[1]?.trim() || "");
  const contactDetails = headerLines.slice(2).map((l) => clean(l.trim()));

  const bodyChildren: Paragraph[] = [];
  for (const section of bodySections) {
    bodyChildren.push(sectionHeading(section.title, p));
    const lines = section.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const raw = clean(lines[i].trim());
      if (!raw) continue;
      const isBullet = /^[-•*▸]/.test(raw);
      const text = isBullet ? raw.replace(/^[-•*▸]\s*/, "") : raw;
      if (isBullet) bodyChildren.push(bodyBullet(text, p, "bullets"));
      else if (/\b(19|20)\d{2}\b/.test(raw) && raw.length < 100) bodyChildren.push(orgDateLine(text, p));
      else if (raw.length < 80 && /^[A-Z]/.test(raw) && i < lines.length - 1) bodyChildren.push(subHeading(text, p));
      else bodyChildren.push(bodyNormal(text, p));
    }
  }

  const doc = new Document({
    numbering: {
      config: [{
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u25B8", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 220 } }, run: { color: hex(p.accent), bold: true } },
        }],
      }],
    },
    styles: { default: { document: { run: { font: "Calibri", size: 20, color: hex(p.darkText) } } } },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_W, height: 15840 },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      children: [
        // Header bar
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
                  children: [new TextRun({ text: personName.toUpperCase(), bold: true, size: 60, color: hex(p.white), font: "Calibri" })],
                  spacing: { after: 60 },
                }),
                ...(tagline ? [new Paragraph({
                  children: [new TextRun({ text: tagline, size: 24, color: hex(p.steel), font: "Calibri", italics: true })],
                  spacing: { after: 60 },
                })] : []),
                ...(contactDetails.length > 0 ? [new Paragraph({
                  children: contactDetails.flatMap((d, i) => [
                    ...(i > 0 ? [new TextRun({ text: "   |   ", size: 18, color: hex(p.steel), font: "Calibri" })] : []),
                    new TextRun({ text: d, size: 18, color: hex(p.accent), font: "Calibri" }),
                  ]),
                  spacing: { after: 0 },
                })] : []),
              ],
            })],
          })],
        }),
        // Accent stripe
        new Table({
          width: { size: PAGE_W, type: WidthType.DXA },
          columnWidths: [PAGE_W],
          rows: [new TableRow({
            children: [new TableCell({
              borders: noBorders,
              width: { size: PAGE_W, type: WidthType.DXA },
              shading: { fill: hex(p.accent), type: ShadingType.CLEAR },
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              children: [new Paragraph({ children: [new TextRun({ text: "", size: 4 })], spacing: { before: 0, after: 0 } })],
            })],
          })],
        }),
        // Body — 1" top/bottom, 0.6" left/right padding
        new Table({
          width: { size: PAGE_W, type: WidthType.DXA },
          columnWidths: [PAGE_W],
          rows: [new TableRow({
            children: [new TableCell({
              borders: noBorders,
              width: { size: PAGE_W, type: WidthType.DXA },
              shading: { fill: hex(p.white), type: ShadingType.CLEAR },
              margins: { top: 1440, bottom: 1440, left: 864, right: 864 },
              children: bodyChildren.length > 0
                ? bodyChildren
                : [new Paragraph({ children: [new TextRun({ text: " ", size: 10 })] })],
            })],
          })],
        }),
      ],
    }],
  });

  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const body = await req.json();
    if (!Array.isArray(body?.sections)) {
      return new Response(JSON.stringify({ error: "sections (array) is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const buffer = await generateCV({
      sections: body.sections as Section[],
      palette: body.palette as Palette | undefined,
      fileName: body.fileName,
    });
    const fileName = (body.fileName || "cv.docx").replace(/[^a-zA-Z0-9._-]/g, "_");
    return new Response(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    console.error("generate-cv error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
