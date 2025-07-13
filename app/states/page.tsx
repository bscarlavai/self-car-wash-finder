import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Star, Bubbles, Heart } from 'lucide-react'
import { generateSocialPreview } from '@/components/SocialPreview'
import { getStatesWithLocations } from '@/lib/stateUtils'

export async function generateMetadata(): Promise<Metadata> {
  const states = await getStatesWithLocations()
  const totalLocations = states.reduce((sum, state) => sum + state.locationCount, 0)
  
  const social = generateSocialPreview({
    title: 'Self Service Car Washes by State - Find Self Service Car Washes Near You | Self Service Car Wash Finder',
    description: `Discover self-service car washes across all 50 states. Browse ${states.length} states with ${totalLocations} curated self-service car washes. Find auto washes, car wash locations, and self-service facilities near you.`,
    url: 'https://www.selfcarwashfinder.com/states',
  })
  return {
    ...social,
    alternates: {
      canonical: 'https://www.selfcarwashfinder.com/states',
    },
  }
}

export default async function StatesPage() {
  const states = await getStatesWithLocations()
  const totalLocations = states.reduce((sum, state) => sum + state.locationCount, 0)
  const totalStates = states.length
  const topStates = states.slice(0, 3) // Top 3 states by cafe count
  const remainingStates = states.slice(3).sort((a, b) => a.name.localeCompare(b.name)) // Alphabetical for easier navigation

  // Group remaining states by first letter
  const groupedStates = remainingStates.reduce((acc, state) => {
    const firstLetter = state.name.charAt(0)
    if (!acc[firstLetter]) {
      acc[firstLetter] = []
    }
    acc[firstLetter].push(state)
    return acc
  }, {} as { [key: string]: typeof remainingStates })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Self Service Car Washes by State
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From California to New York, discover the best self-service car washes across all 50 states. 
            Whether you're looking to wash your car quickly, save money on car care, or simply find a reliable car wash near you, 
            we've got you covered with curated self-service car washes nationwide.
          </p>
        </div>

        {/* Statistics Section */}
        <div className="bg-carwash-light-100 rounded-xl shadow-lg p-8 mb-12 border border-carwash-light-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-tarawera mb-2">{totalStates}</div>
              <div className="text-gray-600 font-medium">States with Self Service Car Washes</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-carwash-blue mb-2">{totalLocations}</div>
              <div className="text-gray-600 font-medium">Total Self Service Car Washes</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-carwash-light mb-2">{Math.round(totalLocations / totalStates)}</div>
              <div className="text-gray-600 font-medium">Average per State</div>
            </div>
          </div>
        </div>

        {/* Featured States Section */}
        {topStates.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Most Popular States
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topStates.map((state, index) => (
                <Link
                  key={state.slug}
                  href={`/states/${state.slug}`}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-carwash-light-200 hover:border-tarawera transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-carwash-blue/10 p-3 rounded-full mr-4">
                        <MapPin className="h-6 w-6 text-carwash-blue" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {state.name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600">
                          <Star className="h-4 w-4 text-yellow-500 mr-1 fill-current" />
                          <span>#{index + 1} Most Popular</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-tarawera mb-2">
                      {state.locationCount}
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      {state.locationCount === 1 ? 'Self Service Car Wash' : 'Self Service Car Washes'}
                    </div>
                    <div className="bg-carwash-light-100 text-carwash-blue px-4 py-2 rounded-lg font-semibold border border-carwash-light-200 hover:bg-carwash-light-200 hover:text-tarawera transition-colors">
                      Explore Car Washes →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All States Section - Alphabetically Grouped */}
        {Object.keys(groupedStates).length > 0 && (
          <div>
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
    </div>
  )
} 