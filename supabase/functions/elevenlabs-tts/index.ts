import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Lauren - custom voice from elevenlabs.io/app/voice-library
const DEFAULT_VOICE_ID = "DODLEQrClDo8wCz460ld";
const DEFAULT_MODEL_ID = "eleven_v3";
const FALLBACK_MODEL_ID = "eleven_turbo_v2_5";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_USER_API_KEY") ?? Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_USER_API_KEY is not configured");

    const { text, voiceId = DEFAULT_VOICE_ID, modelId = DEFAULT_MODEL_ID } = await req.json();
    if (!text) throw new Error("Text is required");

    const synthesize = async (targetModelId: string) => {
      return await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: targetModelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true,
              speed: 1.0,
            },
          }),
        }
      );
    };

    let response = await synthesize(modelId);

    // If eleven_v3 isn't available on the account/plan, fall back to turbo v2.5 with the same voice
    if (!response.ok && modelId === DEFAULT_MODEL_ID) {
      const errText = await response.text();
      console.warn("Primary model failed, falling back", { status: response.status, errText });
      response = await synthesize(FALLBACK_MODEL_ID);
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errText);
      throw new Error(`TTS failed: ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (e) {
    console.error("tts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
