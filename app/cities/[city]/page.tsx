import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Star, Heart, ArrowRight, Phone, Globe, Navigation, ArrowLeft, Coffee, Users, Clock } from 'lucide-react'
import { getLocations } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { generateSocialPreview } from '@/components/SocialPreview'
import { getShopCardImage } from '@/lib/imageUtils'
import LocationCard from '@/components/LocationCard'
// @ts-ignore
import slugify from '@/lib/slugify'
import { getSupabaseClient } from '@/lib/supabase'
import NearbyLocationsSection from '@/components/NearbyLocationsSection';
import { LocalBusinessStructuredData, BreadcrumbStructuredData } from '@/components/StructuredData'

interface PageProps {
  params: {
    city: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cityName = params.city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const locations = await getLocations({ city: params.city })
  const firstLocation = locations && Array.isArray(locations.data) && locations.data.length > 0 ? locations.data[0] : null
  const image = firstLocation && firstLocation.photo_url ? firstLocation.photo_url : null

  const social = generateSocialPreview({
    title: `${cityName} Cat Cafes - Find Local Cat Cafes | Cat Cafe Directory`,
    description: `Discover cat cafes and adoption centers in ${cityName}. Find the perfect place to enjoy cats near you.`,
    image,
    url: `https://catcafedirectory.com/cities/${params.city}`,
  })

  return {
    ...social,
    alternates: {
      canonical: `https://catcafedirectory.com/cities/${params.city}`,
    },
  }
}

const stateSlugs = [
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
  'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
  'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
  'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new-hampshire',
  'new-jersey', 'new-mexico', 'new-york', 'north-carolina', 'north-dakota', 'ohio',
  'oklahoma', 'oregon', 'pennsylvania', 'rhode-island', 'south-carolina', 'south-dakota',
  'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west-virginia',
  'wisconsin', 'wyoming', 'district-of-columbia'
];

// Map state slugs to full state names for better matching
const stateSlugToName: Record<string, string> = {
  'alabama': 'Alabama',
  'alaska': 'Alaska',
  'arizona': 'Arizona',
  'arkansas': 'Arkansas',
  'california': 'California',
  'colorado': 'Colorado',
  'connecticut': 'Connecticut',
  'delaware': 'Delaware',
  'florida': 'Florida',
  'georgia': 'Georgia',
  'hawaii': 'Hawaii',
  'idaho': 'Idaho',
  'illinois': 'Illinois',
  'indiana': 'Indiana',
  'iowa': 'Iowa',
  'kansas': 'Kansas',
  'kentucky': 'Kentucky',
  'louisiana': 'Louisiana',
  'maine': 'Maine',
  'maryland': 'Maryland',
  'massachusetts': 'Massachusetts',
  'michigan': 'Michigan',
  'minnesota': 'Minnesota',
  'mississippi': 'Mississippi',
  'missouri': 'Missouri',
  'montana': 'Montana',
  'nebraska': 'Nebraska',
  'nevada': 'Nevada',
  'new-hampshire': 'New Hampshire',
  'new-jersey': 'New Jersey',
  'new-mexico': 'New Mexico',
  'new-york': 'New York',
  'north-carolina': 'North Carolina',
  'north-dakota': 'North Dakota',
  'ohio': 'Ohio',
  'oklahoma': 'Oklahoma',
  'oregon': 'Oregon',
  'pennsylvania': 'Pennsylvania',
  'rhode-island': 'Rhode Island',
  'south-carolina': 'South Carolina',
  'south-dakota': 'South Dakota',
  'tennessee': 'Tennessee',
  'texas': 'Texas',
  'utah': 'Utah',
  'vermont': 'Vermont',
  'virginia': 'Virginia',
  'washington': 'Washington',
  'west-virginia': 'West Virginia',
  'wisconsin': 'Wisconsin',
  'wyoming': 'Wyoming',
  'district-of-columbia': 'District of Columbia'
};

function parseCityStateSlug(slug: string): { citySlug: string; stateSlug: string; stateName: string | null } {
  // Sort state slugs by length (longest first) to match multi-word states first
  const sortedStateSlugs = stateSlugs.sort((a, b) => b.length - a.length);
  
  for (const stateSlug of sortedStateSlugs) {
    if (slug.endsWith('-' + stateSlug)) {
      return {
        citySlug: slug.slice(0, -(stateSlug.length + 1)),
        stateSlug,
        stateName: stateSlugToName[stateSlug] || null
      };
    }
    if (slug === stateSlug) {
      return { citySlug: '', stateSlug, stateName: stateSlugToName[stateSlug] || null };
    }
  }
  
  // Fallback: try to extract state from the last part
  const parts = slug.split('-');
  if (parts.length >= 2) {
    const lastPart = parts.slice(-1)[0];
    const secondLastPart = parts.slice(-2)[0];
    
    // Check if last two parts form a state (e.g., "north-carolina")
    const twoPartState = `${secondLastPart}-${lastPart}`;
    if (stateSlugs.includes(twoPartState)) {
      return {
        citySlug: parts.slice(0, -2).join('-'),
        stateSlug: twoPartState,
        stateName: stateSlugToName[twoPartState] || null
      };
    }
    
    // Check if just the last part is a state
    if (stateSlugs.includes(lastPart)) {
      return {
        citySlug: parts.slice(0, -1).join('-'),
        stateSlug: lastPart,
        stateName: stateSlugToName[lastPart] || null
      };
    }
  }
  
  // If no state found, return the whole slug as city
  return {
    citySlug: slug,
    stateSlug: '',
    stateName: null
  };
}

async function getLocationsByCity(cityStateSlug: string) {
  try {
    const { citySlug, stateSlug, stateName } = parseCityStateSlug(cityStateSlug);
    const citySlugified = slugify(citySlug);
    const stateSlugified = slugify(stateSlug || stateName || '');
    // Query by city_slug and state
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_visible', true)
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('city_slug', citySlugified)
      .ilike('state', `%${stateSlugified.replace(/-/g, ' ')}%`);
    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
    if (data && data.length > 0) {
      return data;
    }
    // Fallback: try broader search for similar cities
    const { data: allLocations } = await getLocations();
    const broaderFiltered = (allLocations || []).filter(loc =>
      loc.city_slug === citySlugified
    );
    return broaderFiltered || [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

export default async function CityPage({ params }: PageProps) {
  const citySlug = params.city
  const locations = await getLocationsByCity(citySlug)
  if (locations.length === 0) {
    // Try to get suggestions for similar cities
    const { citySlug: parsedCitySlug, stateSlug, stateName } = parseCityStateSlug(citySlug);
    // Get all locations to find similar cities
    const { data: allLocations } = await getLocations();
    const currentSlug = `${slugify(parsedCitySlug)}-${slugify(stateSlug || stateName || '')}`;
    const similarCities = (allLocations || [])
      .filter(location => {
        const locationSlug = `${slugify(location.city)}-${slugify(location.state)}`;
        // Only suggest if not the current slug
        if (locationSlug === currentSlug) return false;
        // Fuzzy match for similar cities
        return (
          slugify(location.city).includes(slugify(parsedCitySlug)) ||
          slugify(parsedCitySlug).includes(slugify(location.city)) ||
          location.city.toLowerCase().includes(parsedCitySlug.replace(/-/g, ' ')) ||
          parsedCitySlug.replace(/-/g, ' ').includes(location.city.toLowerCase())
        );
      })
      .slice(0, 5);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <MapPin className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              No Cat Cafes Found
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              We couldn't find any cat cafes in "{parsedCitySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}"{stateName ? `, ${stateName}` : ''}.
            </p>
            
            {similarCities.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Did you mean one of these cities?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {similarCities.map((location) => (
                    <Link
                      key={location.id}
                      href={`/cities/${slugify(location.city)}-${slugify(location.state)}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-lavender-300 hover:shadow-md transition-all"
                    >
                      <h3 className="font-semibold text-gray-900">{location.city}</h3>
                      <p className="text-gray-600">{location.state}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <Link
                href="/states"
                className="inline-flex items-center bg-lavender-500 text-white px-6 py-3 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-lavender-600 transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Browse All States
              </Link>
              <div className="text-gray-500">
                <p>Or try searching for a different city or state</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const state = locations[0]?.state || ''
  const cityName = locations[0]?.city || citySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Get lat/lng from first location
  const cityLat = locations[0]?.latitude;
  const cityLng = locations[0]?.longitude;
  const cityLocationIds = new Set(locations.map(loc => loc.id));

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: 'Home', url: 'https://catcafedirectory.com' },
    { name: 'States', url: 'https://catcafedirectory.com/states' },
    { name: state, url: `https://catcafedirectory.com/states/${state.toLowerCase().replace(/\s+/g, '-')}` },
    { name: cityName, url: `https://catcafedirectory.com/cities/${citySlug}` }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <LocalBusinessStructuredData cafe={{
        name: `Cat Cafes in ${cityName}`,
        description: `Find the best cat cafes in ${cityName}, ${state}. Discover ${locations.length} cat cafes and adoption centers.`,
        city: cityName,
        state: state,
        latitude: cityLat,
        longitude: cityLng,
        location_hours: []
      }} />
      <BreadcrumbStructuredData items={breadcrumbItems} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href="/states" className="hover:text-lavender-600 transition-colors">
                States
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/states/${state.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-lavender-600 transition-colors">
                {state}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">{cityName}</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-lavender-50 to-peach-50 rounded-2xl shadow-lg p-8 mb-8 border border-lavender-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-lavender-100 rounded-full mb-4">
              <MapPin className="h-8 w-8 text-lavender-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Cat Cafes in {cityName}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover {locations.length} purr-fect cat cafes and adoption centers in {cityName}, {state}. 
              Find the perfect place to enjoy coffee with cats near you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-md border border-lavender-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-lavender-100 p-3 rounded-full mr-4">
                  <Coffee className="h-6 w-6 text-lavender-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Local Cafes</h3>
              </div>
              <p className="text-gray-600 text-sm">
                {locations.length} curated cat cafes in {cityName} with detailed information on services and amenities.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md border border-purple-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Adoption Centers</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Many cafes partner with local shelters to help cats find their forever homes.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md border border-green-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Community Hubs</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Connect with fellow cat lovers and support local animal welfare initiatives.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-2 fill-current" />
              Why Choose {cityName} Cat Cafes?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-lavender-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span>Comprehensive directory of all curated cat cafes in {cityName}</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-lavender-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span>Detailed information on adoption programs and services</span>
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


        {/* Cafes Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Cat Cafes in {cityName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                is_visible={location.is_visible}
                business_status={location.business_status}
                street_address={location.street_address}
                phone={location.phone}
                website_url={location.website_url}
              />
            ))}
          </div>
        </div>
        {/* Cat Cafes Near [City] Section */}
        {cityLat && cityLng && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Cat Cafes Near {cityName}
            </h2>
            <NearbyLocationsSection
              latitude={cityLat}
              longitude={cityLng}
              currentLocationId={''}
              city={cityName}
              state={state}
              excludeIds={Array.from(cityLocationIds)}
            />
          </div>
        )}
        {/* Back to State */}
        <div className="text-center">
          <Link
            href={`/states/${state.toLowerCase().replace(/\s+/g, '-')}`}
            className="inline-flex items-center bg-lavender-500 text-white px-6 py-3 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-lavender-600 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {state} Cat Cafes
          </Link>
        </div>
      </div>
    </div>
  )
} 