import { MetadataRoute } from 'next'
import { getSupabaseClient } from '@/lib/supabase'
// @ts-ignore
import slugify from '@/lib/slugify'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://catcafedirectory.com'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/cat-cafe-near-me`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/states`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ]

  try {
    const supabase = getSupabaseClient()

    // Get all valid states (only operational/curated locations)
    const { data: states } = await supabase
      .from('locations')
      .select('state')
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('is_visible', true)
      .not('state', 'is', null)

    const uniqueStates = Array.from(new Set(states?.map(location => location.state) || []))
    
    const statePages = uniqueStates.map((state) => ({
      url: `${baseUrl}/states/${slugify(state)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Get all valid locations (only operational/curated locations)
    const { data: locations } = await supabase
      .from('locations')
      .select('slug, state, city, updated_at')
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('is_visible', true)

    const locationPages = (locations || []).map((location) => ({
      url: `${baseUrl}/states/${slugify(location.state)}/${slugify(location.city)}/${location.slug}`,
      lastModified: new Date(location.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    // Get unique cities for city pages (only from valid locations)
    const uniqueCities = Array.from(new Set(locations?.map(location => {
      return `${slugify(location.city)}-${slugify(location.state)}`
    }) || []))
    
    const cityPages = uniqueCities.map((city) => ({
      url: `${baseUrl}/cities/${city}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticPages, ...statePages, ...cityPages, ...locationPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}
