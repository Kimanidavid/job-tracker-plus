import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Apify LinkedIn Jobs scraper (actor id: hKByXkMQaC5Qt9UMN)
// Input: { urls: [linkedin search url], scrapeCompany, count, splitByLocation }

const APIFY_TOKEN = Deno.env.get('APIFY_API_TOKEN');
const ACTOR_ID = 'hKByXkMQaC5Qt9UMN';

interface Body {
  keywords: string;
  location?: string;
  rows?: number;
  postedWithinDays?: number; // freshness filter, default 4
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

function buildLinkedInUrl(keywords: string, location: string, postedWithinDays: number): string {
  const params = new URLSearchParams({
    keywords,
    position: '1',
    pageNum: '0',
    sortBy: 'DD', // sort by date (most recent first)
  });
  if (location) params.set('location', location);
  if (postedWithinDays > 0) {
    // LinkedIn time-posted-range: r{seconds}
    params.set('f_TPR', `r${Math.round(postedWithinDays * 86400)}`);
  }
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
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
    const count = Math.min(Math.max(body.rows ?? 25, 1), 100);
    const location = (body.location || '').trim();
    const postedWithinDays = Math.min(Math.max(body.postedWithinDays ?? 4, 0), 30);

    const input = {
      urls: [buildLinkedInUrl(keywords, location, postedWithinDays)],
      scrapeCompany: true,
      count,
      splitByLocation: false,
    };

    const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?timeout=180`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${APIFY_TOKEN}`,
      },
      body: JSON.stringify(input),
    });

    if (resp.status === 401) {
      return new Response(
        JSON.stringify({ error: 'Apify token rejected. Update APIFY_API_TOKEN with a valid token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

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
      external_id: r.id || r.jobId || r.jobUrl || r.link || r.url || `job-${Date.now()}-${i}`,
      title: r.title || r.jobTitle || 'Untitled role',
      company: r.companyName || r.company?.name || r.company || '',
      location: r.location || r.formattedLocation || r.jobLocation || '',
      url: r.jobUrl || r.link || r.url || '',
      description: stripHtml(r.descriptionHtml || r.description || r.descriptionText || ''),
      posted_at: r.postedAt || r.publishedAt || r.postedTime || r.postDate || null,
      source: 'linkedin',
    })).filter(j => j.title && j.url);

    // Secondary filter: drop jobs older than the freshness window when we have a parseable date
    const cutoffMs = postedWithinDays > 0 ? Date.now() - postedWithinDays * 86400 * 1000 : 0;
    const filtered = cutoffMs
      ? jobs.filter(j => {
          if (!j.posted_at) return true; // keep if unknown
          const t = Date.parse(j.posted_at);
          return Number.isNaN(t) ? true : t >= cutoffMs;
        })
      : jobs;

    return new Response(JSON.stringify({ jobs: filtered, count: filtered.length }), {
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
