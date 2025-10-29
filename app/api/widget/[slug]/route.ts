import type { NextRequest } from 'next/server';
export const runtime = 'edge';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',              // or a specific domain
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  const url = new URL(`${SUPABASE_URL}/rest/v1/widgets`);
  url.searchParams.set('slug', `eq.${slug}`);
  url.searchParams.set('published', 'eq.true');
  url.searchParams.set('select', 'type,config,version,updated_at');

  const r = await fetch(url.toString(), {
    headers: { apikey: SUPABASE_ANON_KEY, accept: 'application/json' },
    cache: 'no-store',
  });

  if (!r.ok) {
    return new Response(JSON.stringify({ error: 'fetch_failed' }), {
      status: 502,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  const rows = await r.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(rows[0]), {
    headers: {
      ...corsHeaders,
      'content-type': 'application/json',
      'cache-control': 'public, max-age=15, s-maxage=300, stale-while-revalidate=600',
    },
  });
}

