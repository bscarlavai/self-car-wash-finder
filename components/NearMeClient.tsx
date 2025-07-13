"use client"

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Star, Search, MapPinIcon, Coffee, Telescope, BadgeQuestionMark, Award } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { searchLocationsByLatLng, searchLocationsByZip } from '@/lib/locationUtils';
import LocationCard from '@/components/LocationCard'
import TopStatesSection from './TopStatesSection';
import { getOpen24HourLocationCount } from '@/lib/stateUtils'

// Helper function to clean URLs consistently
function cleanUrl(url: string): string {
  if (!url) return ''
  let cleaned = url.replace(/^https?:\/\//, '')
  cleaned = cleaned.replace(/^www\./, '')
  cleaned = cleaned.replace(/\/$/, '')
  return cleaned
}

export default function NearMeClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialZip = searchParams.get('zip') || ''
  const [zipCode, setZipCode] = useState(initialZip)
  const [radius, setRadius] = useState('25')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [stats, setStats] = useState({ totalLocations: 0, open24HoursCount: 0, highRatedCount: 0, highRatedPercent: 0 })

  useEffect(() => {
    setZipCode(initialZip)
  }, [initialZip])

  // Auto-search when zip is provided in URL
  useEffect(() => {
    if (initialZip && initialZip.trim()) {
      autoSearch(initialZip.trim())
    }
  }, []) // Only run once on mount

  useEffect(() => {
    async function fetchStats() {
      const supabase = getSupabaseClient()
      // Get total locations count
      const { count: totalLocations } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
        .eq('review_status', 'approved')
      // Get high-rated locations count
      const { count: highRatedCount } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
        .eq('review_status', 'approved')
        .gte('google_rating', 4.0)
      // Open 24 hours
      const open24HoursCount = await getOpen24HourLocationCount()
      const finalTotalLocations = totalLocations || 0
      const finalHighRatedCount = highRatedCount || 0
      const highRatedPercent = finalTotalLocations > 0 ? Math.round((finalHighRatedCount / finalTotalLocations) * 100) : 0
      setStats({ totalLocations: finalTotalLocations, open24HoursCount, highRatedCount: finalHighRatedCount, highRatedPercent })
    }
    fetchStats()
  }, [])

  const radiusOptions = ['5', '10', '15', '25', '50', '100']

  const autoSearch = async (zip: string) => {
    setIsSearching(true)
    setSearchError('')
    try {
      const results = await searchLocationsByZip(zip, Number(radius))
      setSearchResults(results)
      if (results.length === 0) {
        setSearchError(`No self-service car washes found within ${radius} miles of this zip code. Try expanding your search or browse by state.`)
      }
    } catch (error) {
      setSearchError('Invalid zip code. Please enter a valid 5-digit US zip code.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleZipSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!zipCode.trim()) return

    // Update the URL with the new zip (shallow routing, no reload)
    router.replace(`/self-service-car-wash-near-me?zip=${encodeURIComponent(zipCode.trim())}`)

    await autoSearch(zipCode.trim())
  }

  const handleLocationSearch = () => {
    if (navigator.geolocation) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setSearchError('');
          try {
            const results = await searchLocationsByLatLng(lat, lng, Number(radius));
            setSearchResults(results);
            if (results.length === 0) {
              setSearchError(`No self-service car washes found within ${radius} miles of your location. Try expanding your search or browse by state.`);
            }
          } catch (error) {
            setSearchError('Unable to search by your location. Please try again or use zip code search.');
          } finally {
            setIsSearching(false);
          }
        },
        () => {
          setSearchError('Location access denied. Please use zip code search or browse by state.');
          setIsSearching(false);
        }
      );
    } else {
      setSearchError('Geolocation not supported. Please use zip code search or browse by state.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-carwash-light-100 pt-20 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Self Service Car Washes Near Me
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Explore self-service car washes and auto wash stations in your area. Get directions, hours, and contact details for local self-serve car wash locations.
            </p>
          </div>
        </div>
      </section>
      {/* Search Section as Overlap Card */}
      <section className="relative z-10 -mt-8 mb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl py-8 px-4 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 border border-gray-100 items-center">
            <div className="col-span-1 md:col-span-3">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <Search className="h-6 w-6 text-carwash-blue" />
                  <span className="text-lg font-medium text-tarawera">Find Self Service Car Washes Near You</span>
                </div>
                {/* Zip Code Search Form */}
                <form onSubmit={handleZipSearch} className="mb-4 w-full">
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                    <input
                      type="text"
                      id="zipCode"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="Enter Your Zip Code (e.g., 32801)"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tarawera focus:border-transparent text-lg placeholder-gray-500"
                      maxLength={5}
                      autoComplete="postal-code"
                      inputMode="numeric"
                      pattern="[0-9]{5}"
                    />
                    <select
                      value={radius}
                      onChange={e => setRadius(e.target.value)}
                      className="px-4 py-3 pr-10 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-tarawera focus:border-transparent bg-white text-tarawera"
                      style={{ width: '140px', minWidth: '100px' }}
                      aria-label="Search radius in miles"
                    >
                      <option value="" disabled>Select miles</option>
                      {radiusOptions.map(miles => (
                        <option key={miles} value={miles}>{miles} miles</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={isSearching || !zipCode.trim()}
                      className="w-full sm:w-auto border-2 border-tarawera bg-white text-tarawera px-8 py-3 rounded-lg font-semibold transition-colors hover:bg-tarawera hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg whitespace-nowrap group"
                      style={{ minWidth: '140px' }}
                    >
                      {isSearching ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-tarawera mr-2"></div>
                          Searching...
                        </>
                      ) : (
                        'Search'
                      )}
                    </button>
                  </div>
                </form>
                <button
                  type="button"
                  onClick={handleLocationSearch}
                  className="w-full bg-tarawera text-white px-8 py-3 rounded-lg font-semibold shadow-soft hover:bg-tarawera-600 transition-all duration-300 flex items-center justify-center text-lg"
                >
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Use My Location
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        {searchError && (
          <div className="bg-red-100 text-red-800 rounded-lg px-4 py-3 mb-6 text-center font-medium">
            {searchError}
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-tarawera mb-4">Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((location: any) => (
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
        )}
      </section>
      {/* SEO/Feature Section - remove card look */}
      <section className="mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-tarawera mb-4">
              Self Service Car Washes Near Me – Find the Best Self Service Car Washes in Your Area
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Looking for a self-service car wash near you? Find convenient locations where you can wash your car using professional-grade equipment. Our nationwide self-service car wash directory helps you quickly locate the best spots to clean your vehicle on your own schedule.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Directory Features */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-carwash-light-100 rounded-lg flex items-center justify-center">
                  <Telescope className="h-6 w-6 text-carwash-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-tarawera mb-3">
                    Explore Curated Self Service Car Washes Near You
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Our directory features curated self-service car washes with detailed listings that include:
                  </p>
                  {/* CURATED LIST BULLETS (custom flex row, teal dot, section-matching text color) */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-carwash-blue rounded-full"></div>
                      <span className="text-gray-600">Location and directions to self-service car washes near you</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-carwash-blue rounded-full"></div>
                      <span className="text-gray-600">Photos, reviews, and customer ratings</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-carwash-blue rounded-full"></div>
                      <span className="text-gray-600">Available equipment and services</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-carwash-blue rounded-full"></div>
                      <span className="text-gray-600">Pricing and payment options</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-carwash-blue rounded-full"></div>
                      <span className="text-gray-600">Hours of operation and contact info</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Right Column - Why Visit */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-carwash-light-100 rounded-lg flex items-center justify-center">
                  <BadgeQuestionMark className="h-6 w-6 text-carwash-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-tarawera mb-3">
                    Why Choose Self Service Car Washes?
                  </h3>
                  <p className="text-gray-600">
                    Self-service car washes offer convenience, control, and cost-effectiveness — wash your car with professional equipment on your own schedule. Many locations also offer additional services like vacuuming and detailing supplies.
                  </p>
                </div>
              </div>
              {/* Highlight Box */}
              <div className="bg-carwash-light-100 rounded-xl p-6 shadow-sm border border-carwash-light-200">
                <div className="flex items-center space-x-3 mb-3">
                  <MapPinIcon className="h-5 w-5 text-carwash-blue" />
                  <h4 className="font-semibold text-tarawera">Pro Tip: Bring Your Own Supplies</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  For the best results, bring your own towels and cleaning products. Many self-service car washes provide vacuums and vending machines for extra supplies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Top States Section - match Most Popular States on states page */}
      <section className="bg-carwash-light-100 py-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white border border-carwash-light-200 rounded-full mb-4">
              <Award className="h-8 w-8 text-carwash-blue" />
            </div>
            <h2 className="text-3xl font-bold text-tarawera mb-4">
              Top States with Self Service Car Washes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore the states with the most self-service car washes in our directory
            </p>
          </div>
          <TopStatesSection limit={3} />
        </div>
      </section>
    </div>
  )
} 