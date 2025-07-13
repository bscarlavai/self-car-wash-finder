import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Star, Bubbles, Heart } from 'lucide-react'
import { generateSocialPreview } from '@/components/SocialPreview'
import { getStatesWithLocations } from '@/lib/stateUtils'
import TopStatesCard from '@/components/TopStatesCard'
import { getSupabaseClient } from '@/lib/supabase'

export async function generateMetadata(): Promise<Metadata> {
  const social = generateSocialPreview({
    title: 'Self Service Car Washes by State - Find Self Service Car Washes Near You | Self Service Car Wash Finder',
    description: `Discover self service and auto washes locations near you.`,
    url: 'https://www.selfcarwashfinder.com/states',
  })
  return {
    ...social,
    alternates: {
      canonical: 'https://www.selfcarwashfinder.com/states',
    },
  }
}

async function getStats() {
  try {
    const supabase = getSupabaseClient()
    
    // Get total locations count
    const { count: totalLocations, error: totalError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
    
    if (totalError) {
      console.error('Error fetching total count:', totalError)
      return { totalLocations: 0, totalStates: 0, highRatedCount: 0, highRatedPercent: 0, open24HoursCount: 0 }
    }
    
    // Get high-rated locations count
    const { count: highRatedCount, error: highRatedError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
      .gte('google_rating', 4.0)
    
    if (highRatedError) {
      console.error('Error fetching high-rated count:', highRatedError)
      return { totalLocations: 0, totalStates: 0, highRatedCount: 0, highRatedPercent: 0, open24HoursCount: 0 }
    }
    
    // Get 24/7 locations count
    const { data: hoursData, error: hoursError } = await supabase
      .from('location_hours')
      .select('location_id, open_time, close_time, is_closed')
      .eq('is_closed', false)
      .eq('open_time', '12:00 AM')
      .in('close_time', ['11:59 PM', '12:00 AM'])
    
    if (hoursError) {
      console.error('Error fetching 24/7 hours:', hoursError)
      return { totalLocations: 0, totalStates: 0, highRatedCount: 0, highRatedPercent: 0, open24HoursCount: 0 }
    }
    
    // Count unique locations that have 24/7 hours
    const open24HoursLocationIds = new Set(hoursData?.map(h => h.location_id) || [])
    const open24HoursCount = open24HoursLocationIds.size
    
    const finalTotalLocations = totalLocations || 0
    const finalHighRatedCount = highRatedCount || 0
    const highRatedPercent = finalTotalLocations > 0 ? Math.round((finalHighRatedCount / finalTotalLocations) * 100) : 0

    return { 
      totalLocations: finalTotalLocations, 
      totalStates: 50, // Hardcode since we expect all states to be covered
      highRatedCount: finalHighRatedCount, 
      highRatedPercent,
      open24HoursCount
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return { totalLocations: 0, totalStates: 0, highRatedCount: 0, highRatedPercent: 0, open24HoursCount: 0 }
  }
}

export default async function StatesPage() {
  const [states, stats] = await Promise.all([
    getStatesWithLocations(),
    getStats()
  ])
  const totalLocations = states.reduce((sum, state) => sum + state.locationCount, 0)
  const totalStates = states.length
  const sortedStates = [...states].sort((a, b) => b.locationCount - a.locationCount)
  const topStates = sortedStates.slice(0, 3)
  const alphaStates = [...states].sort((a, b) => a.name.localeCompare(b.name))

  // Group all states by first letter
  const groupedStates = alphaStates.reduce((acc, state) => {
    const firstLetter = state.name.charAt(0)
    if (!acc[firstLetter]) {
      acc[firstLetter] = []
    }
    acc[firstLetter].push(state)
    return acc
  }, {} as { [key: string]: typeof alphaStates })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-carwash-light-100 pt-20 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Self Service Car Washes by State
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              From California to New York, discover the best self-service car washes across all 50 states. 
              Whether you're looking to wash your car quickly, save money on car care, or simply find a reliable car wash near you, 
              we've got you covered with curated self-service car washes nationwide.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section with Overlap */}
      <section className="relative z-10 -mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl py-8 px-4 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center border border-gray-100">
            <div>
              <div className="text-4xl font-bold text-tarawera mb-2">{stats.totalLocations}</div>
              <div className="text-gray-600">Self Service Car Washes Nationwide</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-carwash-blue mb-2">{stats.open24HoursCount}</div>
              <div className="text-gray-600">Open 24 Hours</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-carwash-light mb-2">{stats.highRatedCount}</div>
              <div className="text-gray-600">4+ Star Rated</div>
              <div className="text-sm text-manatee mt-1">{stats.highRatedPercent}% 4+ Stars</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation & All States Section */}
      {Object.keys(groupedStates).length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              All States with Self Service Car Washes
            </h2>
            {/* Quick Navigation */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-carwash-light-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Quick Navigation</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {Object.keys(groupedStates).sort().map((letter) => (
                  <a
                    key={letter}
                    href={`#letter-${letter}`}
                    className="bg-carwash-light-100 text-carwash-blue px-3 py-2 rounded-lg text-sm font-semibold border border-carwash-light-200 hover:bg-carwash-light-200 hover:text-tarawera transition-colors"
                  >
                    {letter}
                  </a>
                ))}
              </div>
            </div>
            {/* Alphabetical Groups */}
            <div className="space-y-8">
              {Object.keys(groupedStates).sort().map((letter) => (
                <div key={letter} id={`letter-${letter}`} className="bg-white rounded-lg shadow-md p-6 border border-carwash-light-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="bg-carwash-light-100 text-carwash-blue px-4 py-2 rounded-lg mr-4 font-bold border border-carwash-light-200">
                      {letter}
                    </div>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupedStates[letter].map((state) => (
                      <Link
                        key={state.slug}
                        href={`/states/${state.slug}`}
                        className="bg-carwash-light-100 rounded-lg p-4 border border-carwash-light-200 hover:border-tarawera hover:bg-carwash-light-200 transition-all duration-200"
                      >
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {state.name}
                          </h4>
                          <div className="flex items-center justify-center text-sm text-gray-600 mb-3">
                            <Bubbles className="h-4 w-4 mr-1 text-carwash-blue" />
                            <span>{state.locationCount} {state.locationCount === 1 ? 'car wash' : 'car washes'}</span>
                          </div>
                          <div className="text-carwash-blue font-semibold text-sm">
                            Browse →
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Most Popular States at Bottom */}
      {topStates.length > 0 && (
        <section className="bg-carwash-light-100 py-8 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white border border-carwash-light-200 rounded-full mb-4">
                <Star className="h-8 w-8 text-carwash-blue" />
              </div>
              <h2 className="text-3xl font-bold text-tarawera mb-4">
                Most Popular States
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore the states with the most self-service car washes in our directory
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topStates.map((state, index) => (
                <TopStatesCard
                  key={state.slug}
                  name={state.name}
                  count={state.locationCount}
                  rank={index + 1}
                  href={`/states/${state.slug}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {states.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-carwash-light-100 rounded-lg shadow-md p-8 max-w-md mx-auto border border-carwash-light-200">
            <Heart className="h-12 w-12 text-carwash-blue mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No self-service car washes found</h3>
            <p className="text-gray-600">Check back soon as we're constantly adding new locations!</p>
          </div>
        </div>
      )}
    </div>
  )
} 