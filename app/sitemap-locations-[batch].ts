import { getSupabaseClient } from '@/lib/supabase'
import slugify from '@/lib/slugify'

export const dynamic = 'force-dynamic';

export default async function GET(req: Request, { params }: { params: { batch: string } }) {
  const baseUrl = 'https://www.selfcarwashfinder.com'
  const batchSize = 5000;
  const batchNum = parseInt(params.batch, 10) || 1;
  const from = (batchNum - 1) * batchSize;
  const to = from + batchSize - 1;
  const supabase = getSupabaseClient();
  const { data: locations } = await supabase
    .from('locations')
    .select('slug, state, city_slug, updated_at')
    .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
    .eq('review_status', 'approved')
    .range(from, to);
  const urls = (locations || []).map(location => `/states/${slugify(location.state)}/${location.city_slug}/${location.slug}`);
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