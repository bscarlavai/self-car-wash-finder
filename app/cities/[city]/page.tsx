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
import HeroSection from '@/components/HeroSection';

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
    title: `${cityName} Self Service Car Washes - Find Local Self Service Car Washes | Self Service Car Wash Finder`,
    description: `Discover self service car washes and auto wash stations in ${cityName}. Find the perfect self service car wash near you.`,
    image,
    url: `https://www.selfcarwashfinder.com/cities/${params.city}`,
  })

  return {
    ...social,
    alternates: {
      canonical: `https://www.selfcarwashfinder.com/cities/${params.city}`,
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
      .eq('review_status', 'approved')
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
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <MapPin className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              No Self Service Car Washes Found
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              We couldn't find any self service car washes in "{parsedCitySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}"{stateName ? `, ${stateName}` : ''}.
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
    { name: 'Home', url: 'https://www.selfcarwashfinder.com/' },
    { name: 'States', url: 'https://www.selfcarwashfinder.com/states' },
    { name: state, url: `https://www.selfcarwashfinder.com/states/${state.toLowerCase().replace(/\s+/g, '-')}` },
    { name: cityName, url: `https://www.selfcarwashfinder.com/cities/${citySlug}` }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Hero Section - full-width, no card, with breadcrumbs inside */}
      <HeroSection
        title={`Self Service Car Washes in ${cityName}`}
        description={`Explore ${locations.length} convenient self-service car washes in ${cityName}${state ? ", " + state : ""}. Whether you're a local or a visitor, discover where you can wash your car with professional equipment in ${cityName}.`}
        breadcrumbs={
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-lavender-600 transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
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
        }
      />
      <LocalBusinessStructuredData location={{
        name: `Self Service Car Washes in ${cityName}`,
        description: `Find the best self service car washes in ${cityName}, ${state}. Discover ${locations.length} self service car washes.`,
        city: cityName,
        state: state,
        latitude: cityLat,
        longitude: cityLng,
        location_hours: []
      }} />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Overlap Feature Section - like stats overlap on homepage/states */}
        <section className="relative z-10 -mt-8 mb-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl py-8 px-4 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center border border-gray-100">
              <div>
                <div className="bg-carwash-blue/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-carwash-blue" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Citywide Coverage</h3>
                <p className="text-gray-600">
                  Find self-service car washes throughout {cityName}—your next car wash spot might be just around the corner!
                </p>
              </div>
              <div>
                <div className="bg-carwash-blue/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-carwash-blue" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Curated Listings</h3>
                <p className="text-gray-600">
                  All {locations.length} self-service car washes have been curated with accurate contact info, hours, and current business details.
                </p>
              </div>
              <div>
                <div className="bg-tarawera/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Coffee className="h-8 w-8 text-tarawera" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Equipment</h3>
                <p className="text-gray-600">
                  Whether you want a quick wash or a detailed clean, find your perfect self-service spot in {cityName}.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Locations Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Self Service Car Washes in {cityName}
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
                city_slug={location.city_slug}
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
      </div>
      {/* Self Service Car Washes Near [City] Section - full width */}
      <NearbyLocationsSection
        latitude={cityLat}
        longitude={cityLng}
        currentLocationId={''}
        city={cityName}
        state={state}
        excludeIds={Array.from(cityLocationIds)}
        showBackButton={true}
      />
    </div>
  )
} 