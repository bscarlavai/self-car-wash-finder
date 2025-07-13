import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Star, Heart, ArrowRight, Phone, Globe, Navigation, Coffee } from 'lucide-react'
import { getLocations } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { generateSocialPreview } from '@/components/SocialPreview'
import { getShopCardImage } from '@/lib/imageUtils'
import LocationCard from '@/components/LocationCard'
import slugify from '@/lib/slugify';

interface PageProps {
  params: {
    state: string
  }
}

// Helper function to clean URLs consistently
function cleanUrl(url: string): string {
  if (!url) return ''
  
  // Remove protocol
  let cleaned = url.replace(/^https?:\/\//, '')
  
  // Remove www
  cleaned = cleaned.replace(/^www\./, '')
  
  // Remove trailing slash
  cleaned = cleaned.replace(/\/$/, '')
  
  return cleaned
}

// Helper function to convert slug to proper state name
function slugToStateName(slug: string): string {
  // Common words that should remain lowercase in state names
  const lowercaseWords = ['of', 'the', 'and', 'in', 'on', 'at', 'to', 'for', 'with', 'by']
  
  return slug
    .split('-')
    .map((word, index) => {
      // Always capitalize the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }
      // Keep common words lowercase, capitalize others
      if (lowercaseWords.includes(word.toLowerCase())) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

function truncate(str: string, maxLength: number) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).replace(/\s+\S*$/, '') + '…';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const stateName = params.state.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const locations = await getLocations({ state: params.state })
  const firstLocation = locations && Array.isArray(locations.data) && locations.data.length > 0 ? locations.data[0] : null
  const image = firstLocation && firstLocation.photo_url ? firstLocation.photo_url : null

  const social = generateSocialPreview({
    title: `${stateName} Self Service Car Washes - Find Local Self Service Car Washes | Self Service Car Wash Finder`,
    description: `Explore self-service car washes in ${stateName}. Find locations, hours, reviews, and more on Self Service Car Wash Finder.`,
    image,
    url: `https://www.selfcarwashfinder.com/states/${params.state}`,
  })

  return {
    ...social,
    alternates: {
      canonical: `https://www.selfcarwashfinder.com/states/${params.state}`,
    },
  }
}

async function getLocationsByState(stateSlug: string) {
  try {
    const stateName = slugToStateName(stateSlug)
    
    const { data, error } = await getLocations()
      .ilike('state', `%${stateName}%`)
      .order('google_rating', { ascending: false })

    if (error) {
      console.error('Error fetching locations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching locations:', error)
    return []
  }
}

export default async function StatePage({ params }: PageProps) {
  const stateSlug = params.state
  const stateName = slugToStateName(stateSlug)

  const locations = await getLocationsByState(stateSlug)

  if (locations.length === 0) {
    notFound()
  }

  // Group locations by city
  const locationsByCity = locations.reduce((acc: { [key: string]: any[] }, location) => {
    if (!acc[location.city]) {
      acc[location.city] = []
    }
    acc[location.city].push(location)
    return acc
  }, {})

  // Sort locations within each city alphabetically
  Object.keys(locationsByCity).forEach(city => {
    locationsByCity[city].sort((a, b) => a.name.localeCompare(b.name))
  })

  // Get top cities for content (sorted alphabetically)
  const sortedCities = Object.keys(locationsByCity).sort()
  const topCitiesArr = sortedCities.slice(0, 5)
  const topCities = topCitiesArr.join(', ')
  const cityCount = Object.keys(locationsByCity).length
  const otherCitiesCount = cityCount - topCitiesArr.length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Content Section */}
        <div className="bg-carwash-light-100 rounded-xl shadow-lg p-8 mb-8 border border-carwash-light-200">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Self Service Car Washes in {stateName}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore {locations.length} convenient self-service car washes across {stateName} - from neighborhood spots to city locations. 
              Whether you're a local looking for your regular car wash spot or a visitor needing to clean your vehicle, 
              discover where you can wash your car with professional equipment in the {stateName} self-service car wash scene.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-md border border-carwash-light-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-carwash-blue/10 p-3 rounded-full mr-4">
                  <MapPin className="h-6 w-6 text-carwash-blue" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Statewide Coverage</h3>
              </div>
              <p className="text-gray-600 text-sm">
                {otherCitiesCount > 0
                  ? `Check out self-service car washes in ${topCities} and ${otherCitiesCount} other cities — your next car wash spot in ${stateName} might be here!`
                  : `Check out self-service car washes in ${topCities} — your next car wash spot in ${stateName} might be here!`}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md border border-carwash-light-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-carwash-light/10 p-3 rounded-full mr-4">
                  <Heart className="h-6 w-6 text-carwash-light" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Curated Listings</h3>
              </div>
              <p className="text-gray-600 text-sm">
                All {locations.length} self-service car washes have been curated with accurate contact info, hours, and current business details.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md border border-tarawera/20 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-tarawera/10 p-3 rounded-full mr-4">
                  <Coffee className="h-6 w-6 text-tarawera" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Professional Equipment</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Whether you're looking to wash your car quickly or take your time with detailed cleaning, find your perfect self-service spot.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="h-5 w-5 text-yellow-500 mr-2 fill-current" />
                Why Choose {stateName} Self Service Car Washes?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-lavender-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Comprehensive directory of all curated self-service car washes in {stateName}</span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-lavender-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Detailed information on equipment, services, and facilities</span>
                </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-lavender-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span>Real customer reviews and ratings for each location</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-lavender-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span>Up-to-date contact information and operating hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* City Navigation */}
        {Object.keys(locationsByCity).length > 1 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Jump to City</h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(locationsByCity).sort().map(city => (
                <a
                  key={city}
                  href={`#city-${slugify(city)}`}
                  className="bg-carwash-light-100 text-carwash-blue px-3 py-2 rounded-lg text-sm font-semibold border border-carwash-light-200 hover:bg-carwash-light-200 hover:text-tarawera transition-colors"
                >
                  {city} ({locationsByCity[city].length})
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {sortedCities.map((city) => (
            <div key={city} className="bg-white rounded-lg shadow-md p-6" id={`city-${slugify(city)}`}>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <MapPin className="h-6 w-6 text-lavender-500 mr-2" />
                {city}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locationsByCity[city].map((location) => (
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
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/states"
            className="inline-flex items-center text-lavender-600 hover:text-lavender-700 font-medium"
          >
            ← Back to All States
          </Link>
        </div>
      </div>
    </div>
  )
} 