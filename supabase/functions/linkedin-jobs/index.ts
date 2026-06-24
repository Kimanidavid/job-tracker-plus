import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Calls Apify's LinkedIn Jobs Scraper actor synchronously and returns normalized rows.
// Actor: bebity/linkedin-jobs-scraper  (slug `bebity~linkedin-jobs-scraper`)
// Input shape: { title, location, rows }
// Output items expose at least: title, companyName, location, link, descriptionHtml, postedTime

const APIFY_TOKEN = Deno.env.get('APIFY_API_TOKEN');
const ACTOR = 'bebity~linkedin-jobs-scraper';

interface Body {
  keywords: string;
  location?: string;
  rows?: number;
}

interface Job {
  external_id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  posted_at: string | null;
  source: 'linkedin';
}

function stripHtml(html: string): string {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!APIFY_TOKEN) {
      return new Response(JSON.stringify({ error: 'APIFY_API_TOKEN not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as Body;
    const keywords = (body.keywords || '').trim();
    if (!keywords) {
      return new Response(JSON.stringify({ error: 'keywords required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const rows = Math.min(Math.max(body.rows ?? 25, 1), 50);
    const location = (body.location || '').trim();

    const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=120`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: keywords,
        location: location || 'Worldwide',
        rows,
        publishedAt: 'r604800', // last 7 days
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.error('Apify error', resp.status, text);
      return new Response(
        JSON.stringify({ error: `Apify call failed (${resp.status})`, detail: text.slice(0, 500) }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const raw = (await resp.json()) as any[];
    const jobs: Job[] = (Array.isArray(raw) ? raw : []).map((r, i) => ({
      external_id: r.id || r.jobUrl || r.link || `job-${Date.now()}-${i}`,
      title: r.title || r.jobTitle || 'Untitled role',
      company: r.companyName || r.company || '',
      location: r.location || r.formattedLocation || '',
      url: r.link || r.jobUrl || r.url || '',
      description: stripHtml(r.descriptionHtml || r.description || ''),
      posted_at: r.postedAt || r.publishedAt || r.postedTime || null,
      source: 'linkedin',
    })).filter(j => j.title && j.url);

    return new Response(JSON.stringify({ jobs, count: jobs.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('linkedin-jobs error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
