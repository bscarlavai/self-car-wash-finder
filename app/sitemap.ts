import { MetadataRoute } from 'next'
import { getSupabaseClient } from '@/lib/supabase'
// @ts-ignore
import slugify from '@/lib/slugify'

export default async function GET() {
  const baseUrl = 'https://www.selfcarwashfinder.com'
  const batchSize = 5000;
  const supabase = getSupabaseClient();
  // Get the total count of locations
  const { count: totalLocations } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
    .eq('review_status', 'approved');
  const locationSitemapCount = totalLocations ? Math.ceil(totalLocations / batchSize) : 1;
  const sitemaps = [
    `${baseUrl}/sitemap-static.xml`,
    `${baseUrl}/sitemap-cities.xml`,
    ...Array.from({ length: locationSitemapCount }, (_, i) => `${baseUrl}/sitemap-locations-${i + 1}.xml`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemaps.map(url => `<sitemap><loc>${url}</loc></sitemap>`).join('')}
    </sitemapindex>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
