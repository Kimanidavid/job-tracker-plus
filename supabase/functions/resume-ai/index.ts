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

    // Use tool calling for structured score output
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

    if (action === "score") {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const scoreData = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify({ result: scoreData }), {
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
