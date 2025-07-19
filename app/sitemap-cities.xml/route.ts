import { getSupabaseClient } from '@/lib/supabase'
import slugify from '@/lib/slugify'

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://www.selfcarwashfinder.com'
  const supabase = getSupabaseClient();
  const { data: locations } = await supabase
    .from('locations')
    .select('city, city_slug, state')
    .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
    .eq('review_status', 'approved');
  const uniqueCities = Array.from(new Set((locations || []).map(location => `${location.city_slug}-${slugify(location.state)}`)));
  const urls = uniqueCities.map(city => `/cities/${city}`);
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