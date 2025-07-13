import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateSocialPreview } from '@/components/SocialPreview'
import LocationPageClient from '@/components/LocationPageClient'
import { getSupabaseClient } from '@/lib/supabase'
// @ts-ignore
import slugify from '@/lib/slugify'

interface PageProps {
  params: {
    state: string
    city: string
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cafe = await getCafeBySlugStateAndCity(params.slug, params.state, params.city)
  
  if (!cafe) {
    return generateSocialPreview({
      title: 'Cat Cafe Not Found | Cat Cafe Directory',
      description: 'The requested cat cafe could not be found.',
    })
  }

  const social = generateSocialPreview({
    title: `${cafe.name} - Cat Cafe in ${cafe.city}, ${cafe.state}`,
    description: `Visit ${cafe.name} in ${cafe.city}, ${cafe.state}. ${cafe.description || 'Enjoy cats at this local cat cafe.'} Get directions, hours, and contact information.`,
    image: cafe.photo_url,
    url: `https://catcafedirectory.com/states/${params.state}/${params.city}/${params.slug}`,
    type: 'article',
  })

  return {
    ...social,
    alternates: {
      canonical: `https://catcafedirectory.com/states/${params.state}/${params.city}/${params.slug}`,
    },
  }
}

export default async function CafePage({ params }: PageProps) {
  const cafe = await getCafeBySlugStateAndCity(params.slug, params.state, params.city)

  if (!cafe) {
    notFound()
  }

  return <LocationPageClient location={cafe} params={params} />
}

async function getCafeBySlugStateAndCity(slug: string, state: string, city: string) {
  try {
    const supabase = getSupabaseClient()
    const citySlugified = slugify(city);
    const stateSlugified = slugify(state);
    // Fetch only candidates for this city_slug, state, and visible/operational status
    const { data, error } = await supabase
      .from('locations')
      .select(`*, location_amenities(amenity_name, amenity_category), location_hours(day_of_week, open_time, close_time, is_closed)`)
      .eq('review_status', 'approved')
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('city_slug', citySlugified)
      .ilike('state', `%${stateSlugified.replace(/-/g, ' ')}%`);
    if (error) {
      console.error('Error fetching locations:', error)
      return null
    }
    // Find the exact match for this slug, state, and city using city_slug
    const cafe = data?.find(location => {
      const locationSlug = slugify(location.name)
      return (
        locationSlug === slug &&
        slugify(location.state) === stateSlugified &&
        location.city_slug === citySlugified
      )
    })
    if (!cafe) {
      console.log('No cafe found for:', { slug, state, city })
    }
    return cafe || null
  } catch (error) {
    console.error('Error fetching locations:', error)
    return null
  }
} 