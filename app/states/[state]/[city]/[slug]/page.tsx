import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateSocialPreview } from '@/components/SocialPreview'
import LocationPageClient from '@/components/LocationPageClient'
import { getSupabaseClient } from '@/lib/supabase'
// @ts-ignore
import slugify from '@/lib/slugify'
import { MapPin } from 'lucide-react'

interface PageProps {
  params: {
    state: string
    city: string
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const location = await getLocationBySlugStateAndCity(params.slug, params.state, params.city)
  
  if (!location) {
    return generateSocialPreview({
      title: 'Self Service Car Wash Not Found | Self Service Car Wash Finder',
      description: 'The requested self service car wash could not be found.',
    })
  }

  const social = generateSocialPreview({
    title: `${location.name} - Self Service Car Wash in ${location.city}, ${location.state} | Self Service Car Wash Finder`,
    description: `Find ${location.name} self service car wash in ${location.city}, ${location.state}. ${location.description || 'Get your car cleaned at this local self service car wash.'} Get directions, hours, and contact information.`,
    image: location.photo_url,
    url: `https://www.selfcarwashfinder.com/states/${params.state}/${params.city}/${params.slug}`,
    type: 'article',
  })

  return {
    ...social,
    alternates: {
      canonical: `https://www.selfcarwashfinder.com/states/${params.state}/${params.city}/${params.slug}`,
    },
  }
}

export default async function LocationPage({ params }: PageProps) {
  const location = await getLocationBySlugStateAndCity(params.slug, params.state, params.city)

  if (!location) {
    notFound()
  }

  return (
    <>
      <LocationPageClient location={location} params={params} />
      {/* Full-width CTA Section */}
      <section className="py-16 bg-carwash-light-100 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white border border-carwash-light-200 rounded-full mb-6">
            <MapPin className="h-8 w-8 text-carwash-blue" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            More Self Service Car Washes in {params.state.charAt(0).toUpperCase() + params.state.slice(1).replace(/-/g, ' ')}
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover other amazing self service car washes and auto wash stations in {params.state.charAt(0).toUpperCase() + params.state.slice(1).replace(/-/g, ' ')}
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
            <a
              href={`/states/${params.state}`}
              className="inline-flex items-center justify-center bg-tarawera text-white px-8 py-4 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-carwash-blue transition-all duration-300 w-full md:w-auto"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Browse All Car Washes in {params.state.charAt(0).toUpperCase() + params.state.slice(1).replace(/-/g, ' ')}
            </a>
            <a
              href="/states"
              className="inline-flex items-center justify-center bg-white border-2 border-tarawera text-tarawera px-8 py-4 rounded-lg font-semibold hover:bg-tarawera hover:text-white transition-all duration-300 w-full md:w-auto"
            >
              Explore All States
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

async function getLocationBySlugStateAndCity(slug: string, state: string, city: string) {
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
    const location = data?.find(location => {
      const locationSlug = slugify(location.name)
      return (
        locationSlug === slug &&
        slugify(location.state) === stateSlugified &&
        location.city_slug === citySlugified
      )
    })
    if (!location) {
      console.log('No location found for:', { slug, state, city })
    }
    return location || null
  } catch (error) {
    console.error('Error fetching locations:', error)
    return null
  }
} 