import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { action, resume, jobDescription, editInstruction } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "format":
        systemPrompt = `You are an expert resume formatter. Given raw resume text, you must extract and structure ALL the information into clearly categorized sections for a professional two-column CV layout.

The CV has two areas:
1. SIDEBAR sections (left column): Contact info, Education, Programming/Technical skills, Tools, Languages, Certifications, Specialisations — short, list-based content.
2. MAIN sections (right column): Professional Profile/Summary, Work Experience, Projects, Key Strengths, Expertise areas — longer narrative and bullet-point content.

Rules:
- Extract the person's full name and any title/tagline (e.g. "Data Annotator") from the header.
- For sidebar sections, format skills/items as bullet lists with "- " prefix.
- For main sections, keep bullet points with "- " prefix and preserve role titles, company names, and date ranges on their own lines.
- Include ALL content from the original resume — do not omit anything.
- If a section has sub-items (e.g. role title, then company, then bullets), keep them as separate lines within the section content.
- Use the format_resume tool to return the structured result.`;
        userPrompt = `Here is the raw resume text to structure:\n\n${resume}`;
        break;

      case "tailor":
        systemPrompt = `You are an expert resume writer and ATS optimization specialist. Your job is to tailor a resume to match a specific job description while keeping the content truthful and professional. 

Instructions:
- Rewrite the resume to better match the job description keywords and requirements
- Optimize for ATS (Applicant Tracking Systems) by incorporating relevant keywords
- Improve achievement bullets with quantified results where possible
- Keep all information truthful - do not fabricate experience
- Maintain professional formatting
- Return ONLY the tailored resume text, no explanations`;
        userPrompt = `Here is my current resume:\n\n${resume}\n\nHere is the job description I'm applying for:\n\n${jobDescription}\n\nPlease tailor my resume for this position.`;
        break;

      case "score":
        systemPrompt = `You are an expert ATS and resume scoring specialist. Analyze a resume against a job description and provide a detailed score and recommendations.

You MUST respond using the score_resume tool.`;
        userPrompt = `Resume:\n\n${resume}\n\nJob Description:\n\n${jobDescription}\n\nScore this resume against the job description.`;
        break;

      case "fix":
        systemPrompt = `You are an expert resume writer. Improve the given resume by:
- Fixing grammar and spelling errors
- Improving bullet points with action verbs and quantified achievements
- Enhancing professional tone and clarity
- Optimizing structure and formatting
- Adding missing sections if appropriate

Return ONLY the improved resume text, no explanations.`;
        userPrompt = `Here is my resume to improve:\n\n${resume}`;
        break;

      case "edit":
        systemPrompt = `You are an expert resume writer. Apply the user's specific edit instruction to the resume. Return ONLY the modified resume text, no explanations.`;
        userPrompt = `Resume:\n\n${resume}\n\nEdit instruction: ${editInstruction}\n\nApply this edit and return the full updated resume.`;
        break;

      case "edit_section":
        systemPrompt = `You are an expert resume writer. You will be given a single section from a resume and an edit instruction. Apply the instruction to ONLY this section. Return ONLY the new section content (no title, no explanations, no markdown fences). Preserve bullet points using "- " prefix where appropriate.`;
        userPrompt = `Section content:\n\n${resume}\n\nEdit instruction: ${editInstruction}\n\nReturn the updated section content only.`;
        break;

      case "chat":
        systemPrompt = `You are a helpful, concise resume coach. The user wants ADVICE, FEEDBACK, or to ASK A QUESTION about their CV — they are NOT asking you to rewrite it. Reply conversationally in 1–4 short paragraphs. Do NOT output a rewritten resume. Do NOT include the resume text in your reply.`;
        userPrompt = `Here is the user's current resume for context:\n\n${resume}\n\nUser's message:\n${editInstruction}`;
        break;

      case "generate_skills":
        systemPrompt = `You are an expert resume skills strategist. Given a candidate's full resume, infer a comprehensive, well-organized Skills section. Group skills into clear categories (e.g. "Languages", "Frameworks & Libraries", "Tools & Platforms", "Cloud & DevOps", "Data & AI", "Soft Skills") relevant to this candidate. Only include skills that are genuinely supported by the experience, projects, education, or stated tools in the resume — do not invent unrelated skills. Use the generate_skills tool to return the structured result.`;
        userPrompt = `Resume:\n\n${resume}${editInstruction ? `\n\nAdditional guidance: ${editInstruction}` : ''}`;
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    // Tool calling for format action
    if (action === "format") {
      body.tools = [
        {
          type: "function",
          function: {
            name: "format_resume",
            description: "Return a structured resume with sections categorized for a two-column layout",
            parameters: {
              type: "object",
              properties: {
                person_name: { type: "string", description: "Full name of the person" },
                tagline: { type: "string", description: "Professional title or tagline, e.g. 'Data Annotator | AI Enthusiast'" },
                contact_lines: {
                  type: "array",
                  items: { type: "string" },
                  description: "Contact details: email, phone, location, LinkedIn etc. Each as a separate string."
                },
                sidebar_sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Section heading, e.g. 'Education', 'Programming', 'Specialisations'" },
                      content: { type: "string", description: "Section content. Use '- ' prefix for bullet items, newlines to separate lines." }
                    },
                    required: ["title", "content"],
                    additionalProperties: false
                  },
                  description: "Sections for the sidebar (left column): education, skills, tools, languages, certifications"
                },
                main_sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Section heading, e.g. 'Professional Profile', 'Work Experience'" },
                      content: { type: "string", description: "Section content with full text. Use '- ' for bullets. Keep role titles, orgs, dates on separate lines." }
                    },
                    required: ["title", "content"],
                    additionalProperties: false
                  },
                  description: "Sections for the main area (right column): profile, experience, expertise, strengths"
                }
              },
              required: ["person_name", "tagline", "contact_lines", "sidebar_sections", "main_sections"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "format_resume" } };
    }

    // Tool calling for score action
    if (action === "score") {
      body.tools = [
        {
          type: "function",
          function: {
            name: "score_resume",
            description: "Return a resume score with detailed breakdown and recommendations",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "integer", description: "Overall score 0-100" },
                keyword_match: { type: "integer", description: "Keyword match score 0-100" },
                experience_relevance: { type: "integer", description: "Experience relevance score 0-100" },
                formatting: { type: "integer", description: "Formatting quality score 0-100" },
                impact_bullets: { type: "integer", description: "Achievement/impact bullets score 0-100" },
                summary: { type: "string", description: "Brief overall assessment" },
                strengths: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of resume strengths"
                },
                improvements: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      area: { type: "string" },
                      suggestion: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] }
                    },
                    required: ["area", "suggestion", "priority"],
                    additionalProperties: false
                  },
                  description: "List of improvement suggestions"
                },
                missing_keywords: {
                  type: "array",
                  items: { type: "string" },
                  description: "Important keywords from job description missing in resume"
                }
              },
              required: ["overall_score", "keyword_match", "experience_relevance", "formatting", "impact_bullets", "summary", "strengths", "improvements", "missing_keywords"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "score_resume" } };
    }

    // Tool calling for generate_skills action
    if (action === "generate_skills") {
      body.tools = [
        {
          type: "function",
          function: {
            name: "generate_skills",
            description: "Return a categorized Skills section inferred from the candidate's resume",
            parameters: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  description: "Skill categories (3-7 categories typical). Each category has a label and a list of concise skill items.",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string", description: "Category name, e.g. 'Languages', 'Frameworks & Libraries', 'Cloud & DevOps'" },
                      items: {
                        type: "array",
                        items: { type: "string" },
                        description: "Concise skill names within this category"
                      }
                    },
                    required: ["label", "items"],
                    additionalProperties: false
                  }
                }
              },
              required: ["categories"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "generate_skills" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    if (action === "format" || action === "score") {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const structured = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify({ result: structured }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const content = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("resume-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
