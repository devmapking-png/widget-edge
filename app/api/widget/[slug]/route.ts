import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> } // 👈 Next 16: params is a Promise
) {
  const { slug } = await context.params;        // 👈 await it

  const url = new URL(`${SUPABASE_URL}/rest/v1/widgets`);
  url.searchParams.set('slug', `eq.${slug}`);
  url.searchParams.set('published', 'eq.true');
  url.searchParams.set('select', 'type,config,version,updated_at');

  const r = await fetch(url.toString(), {
    headers: { apikey: SUPABASE_ANON_KEY, accept: 'application/json' },
    cache: 'no-store',
  });

  if (!r.ok) {
    return new Response(JSON.stringify({ error: 'fetch_failed' }), { status: 502 });
  }

  const rows = await r.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  }

  return new Response(JSON.stringify(rows[0]), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=15, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
