import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Star, Heart, ArrowRight, Search as SearchIcon } from 'lucide-react'
import { getLocations } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { generateSocialPreview } from '@/components/SocialPreview'
import { getShopCardImage } from '@/lib/imageUtils'
import LocationCard from '@/components/LocationCard'

interface PageProps {
  searchParams: {
    q?: string
    location?: string
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locations = await getLocations({})
  const firstLocation = locations && Array.isArray(locations.data) && locations.data.length > 0 ? locations.data[0] : null
  const image = firstLocation && firstLocation.photo_url ? firstLocation.photo_url : null

  const social = generateSocialPreview({
    title: 'Search Cat Cafes - Find Local Cat Cafes | Cat Cafe Directory',
    description: 'Search for cat cafes by name, city, or state. Find the perfect cat cafe near you with our comprehensive search.',
    image,
  })
  return {
    ...social,
    alternates: {
      canonical: 'https://catcafedirectory.com/search',
    },
  }
}

async function searchLocations(query: string, location?: string) {
  try {
    let searchQuery = getLocations()
      .order('google_rating', { ascending: false })

    if (query && location) {
      // Search in both query and location
      searchQuery = searchQuery.or(
        `name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,description.ilike.%${query}%,name.ilike.%${location}%,city.ilike.%${location}%,state.ilike.%${location}%`
      )
    } else if (query) {
      // Search only in query
      searchQuery = searchQuery.or(
        `name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,description.ilike.%${query}%`
      )
    } else if (location) {
      // Search only in location
      searchQuery = searchQuery.or(
        `name.ilike.%${location}%,city.ilike.%${location}%,state.ilike.%${location}%`
      )
    } else {
      // No search terms, return empty
      return []
    }

    const { data, error } = await searchQuery.limit(50)

    if (error) {
      console.error('Search error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q: query, location } = searchParams
  
  if (!query && !location) {
    notFound()
  }

  const locations = await searchLocations(query || '', location)
  const searchTerm = query || location || ''

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <SearchIcon className="h-6 w-6 text-lavender-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              Cat Cafe Search Results
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            {locations.length > 0 
              ? `Found ${locations.length} cat cafe${locations.length === 1 ? '' : 's'} for "${searchTerm}"`
              : `No cat cafes found for "${searchTerm}"`
            }
          </p>
        </div>

        {/* Search Results */}
        {locations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                id={location.id}
                name={location.name}
                city={location.city}
                state={location.state}
                slug={location.slug}
                description={location.description}
                google_rating={location.google_rating}
                review_count={location.review_count}
                photo_url={location.photo_url}
                location_hours={location.location_hours}
                business_status={location.business_status}
                street_address={location.street_address}
                phone={location.phone}
                website_url={location.website_url}
              />
            ))}
          </div>
        ) : (
          /* No Results */
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <SearchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No cat cafes found
              </h2>
              <p className="text-gray-600 mb-8">
                We couldn't find any cat cafes matching "{searchTerm}". Try searching with different terms or browse by state.
              </p>
              <div className="space-y-4">
                <Link
                  href="/states"
                  className="inline-flex items-center bg-lavender-500 text-white px-6 py-3 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-lavender-600 transition-all duration-300"
                >
                  Explore States Directory
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <div className="text-sm text-gray-500">
                  <p>Try searching for:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Just the city name (e.g., "Miami")</li>
                    <li>• Just the state name (e.g., "Florida")</li>
                    <li>• Cafe name (e.g., "Kitty")</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Tips */}
        {locations.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">How to Search Effectively</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Search by Location</h3>
                <p className="text-gray-600 text-sm">
                  Enter a city or state name to find cat cafes in that area.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Search by Name</h3>
                <p className="text-gray-600 text-sm">
                  Search for specific cafe names or keywords like "kitty" or "paws".
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Explore State Directory</h3>
                <p className="text-gray-600 text-sm">
                  Can't find what you're looking for? Browse our complete directory by state.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 