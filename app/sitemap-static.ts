import { getSupabaseClient } from '@/lib/supabase'
import slugify from '@/lib/slugify'

export const dynamic = 'force-dynamic';

export default async function GET() {
  const baseUrl = 'https://www.selfcarwashfinder.com'
  // Static pages
  const staticPages = [
    '',
    '/self-service-car-wash-near-me',
    '/states',
    '/privacy',
    '/terms',
  ];
  // Get all valid states
  const supabase = getSupabaseClient();
  const { data: states } = await supabase
    .from('locations')
    .select('state')
    .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
    .eq('review_status', 'approved')
    .not('state', 'is', null);
  const uniqueStates = Array.from(new Set(states?.map(location => location.state) || []));
  const statePages = uniqueStates.map((state) => `/states/${slugify(state)}`);
  const urls = [...staticPages, ...statePages];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls.map(url => `<url><loc>${baseUrl}${url}</loc></url>`).join('')}
    </urlset>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
} 