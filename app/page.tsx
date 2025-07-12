import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Star, Heart, Coffee, Users, ArrowRight } from 'lucide-react'
import { getLocations, getSupabaseClient } from '@/lib/supabase'
import { generateSocialPreview } from '@/components/SocialPreview'
import LocationCard from '@/components/LocationCard'

export async function generateMetadata(): Promise<Metadata> {
  const cafes = await getLocations({})
  const firstCafe = cafes && Array.isArray(cafes.data) && cafes.data.length > 0 ? cafes.data[0] : null
  const image = firstCafe && firstCafe.photo_url ? firstCafe.photo_url : null
  
  return generateSocialPreview({
    title: 'Cat Cafe Directory - Find Local Cat Cafes Nationwide',
    description: 'Discover the best cat cafes across the United States. Find adoption centers, cat cafes, and feline-friendly spaces near you.',
    image,
  })
}

async function getFeaturedCafes() {
  try {
    const supabase = getSupabaseClient()
    
    // Get all locations with ratings and review counts
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('is_visible', true)
      .not('google_rating', 'is', null)
      .not('review_count', 'is', null)

    if (locationsError) {
      console.error('Error fetching featured locations:', locationsError)
      return []
    }

    if (!locations || locations.length === 0) {
      return []
    }

    // Calculate weighted score for each location
    // Formula: (rating * 0.7) + (min(review_count/100, 1) * 0.3)
    // This gives 70% weight to rating and 30% weight to review count (capped at 100 reviews)
    const locationsWithScores = locations.map(location => {
      const rating = location.google_rating || 0
      const reviewCount = location.review_count || 0
      
      // Normalize review count (0-100 reviews = 0-1 score)
      const reviewScore = Math.min(reviewCount / 100, 1)
      
      // Calculate weighted score
      const weightedScore = (rating * 0.7) + (reviewScore * 0.3)
      
      return {
        ...location,
        weightedScore
      }
    })

    // Sort by weighted score and take top 6
    const topLocations = locationsWithScores
      .sort((a, b) => {
        // Primary sort by weighted score
        if (Math.abs(a.weightedScore - b.weightedScore) > 0.1) {
          return b.weightedScore - a.weightedScore
        }
        // Secondary sort by review count when scores are close
        return (b.review_count || 0) - (a.review_count || 0)
      })
      .slice(0, 6)
      .map(location => {
        // Remove the weightedScore from the final object
        const { weightedScore, ...locationWithoutScore } = location
        return locationWithoutScore
      })

    // Get hours for all featured locations
    const locationIds = topLocations.map(location => location.id)
    const { data: hours, error: hoursError } = await supabase
      .from('location_hours')
      .select('*')
      .in('location_id', locationIds)

    if (hoursError) {
      console.error('Error fetching location hours:', hoursError)
      // Return locations without hours if hours fetch fails
      return topLocations
    }

    // Attach hours to each location
    const locationsWithHours = topLocations.map(location => ({
      ...location,
      location_hours: hours?.filter(h => h.location_id === location.id) || []
    }))

    return locationsWithHours
  } catch (error) {
    console.error('Error fetching featured locations:', error)
    return []
  }
}

async function getStats() {
  try {
    const supabase = getSupabaseClient()
    
    // Get total count of locations
    const { count: totalCafes, error: countError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('is_visible', true)
    
    if (countError) {
      console.error('Error fetching location count:', countError)
      return { totalCafes: 0, totalStates: 0, highRatedCount: 0, highRatedPercent: 0 }
    }
    
    // Get count of high-rated locations (4+ stars)
    const { count: highRatedCount, error: highRatedError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('is_visible', true)
      .gte('google_rating', 4.0)
    
    if (highRatedError) {
      console.error('Error fetching high-rated count:', highRatedError)
      return { totalCafes: 0, totalStates: 0, highRatedCount: 0, highRatedPercent: 0 }
    }
    
    // Get unique states count - use SQL to count distinct states
    let totalStates = 0;
    const { data: statesData, error: statesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT COUNT(DISTINCT state) as state_count 
          FROM locations 
          WHERE state IS NOT NULL
          AND business_status IN ('OPERATIONAL', 'CLOSED_TEMPORARILY')
          AND is_visible = true
        `
      })
    
    if (statesError) {
      console.error('Error fetching states count:', statesError)
      // Fallback to the previous method
      const { data: states, error: fallbackError } = await supabase
        .from('locations')
        .select('state')
        .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
        .eq('is_visible', true)
        .not('state', 'is', null)
        .limit(10000)
      
      if (fallbackError) {
        return { totalCafes: 0, totalStates: 0, highRatedCount: 0, highRatedPercent: 0 }
      }
      
      const uniqueStates = new Set(states.map((location: any) => location.state).filter(Boolean))
      totalStates = uniqueStates.size
    } else {
      totalStates = statesData?.[0]?.state_count || 0
    }
    
    const finalTotalCafes = totalCafes || 0
    const finalHighRatedCount = highRatedCount || 0
    const highRatedPercent = finalTotalCafes > 0 ? Math.round((finalHighRatedCount / finalTotalCafes) * 100) : 0

    return { totalCafes: finalTotalCafes, totalStates, highRatedCount: finalHighRatedCount, highRatedPercent }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return { totalCafes: 0, totalStates: 0, highRatedCount: 0, highRatedPercent: 0 }
  }
}

export default async function HomePage() {
  const [featuredCafes, stats] = await Promise.all([
    getFeaturedCafes(),
    getStats()
  ])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-hero-gradient py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Your Perfect
              <span className="text-lavender-600"> Cat Cafe</span>
              <br />
              <span className="text-2xl md:text-3xl font-normal text-gray-700">Across the United States</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover cozy cat cafes across the United States where you can enjoy coffee, 
              meet adorable cats, and potentially find your new best friend.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/states"
                className="bg-lavender-500 text-white px-8 py-4 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-lavender-600 transition-all duration-300 flex justify-center items-center"
              >
                Explore All States
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#featured"
                className="bg-white/80 border border-lavender-300 text-lavender-700 px-8 py-4 rounded-lg font-semibold hover:bg-lavender-100 hover:text-lavender-900 transition-colors shadow-soft"
              >
                See Top-Rated Cafes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-lavender-600 mb-2">{stats.totalCafes}</div>
              <div className="text-gray-600">Cat Cafes Nationwide</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-peach-600 mb-2">{stats.totalStates}</div>
              <div className="text-gray-600">States Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-mint-600 mb-2">{stats.highRatedCount}</div>
              <div className="text-gray-600">4+ Star Rated</div>
              <div className="text-sm text-gray-500 mt-1">{stats.highRatedPercent}% 4+ Stars</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cafes */}
      {featuredCafes.length > 0 && (
        <section id="featured" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Top-Rated Cat Cafes
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover the highest-rated cat cafes across the country, 
                featuring real reviews and curated information.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {featuredCafes.map((location) => (
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
                  is_visible={location.is_visible}
                  location_hours={location.location_hours}
                  business_status={location.business_status}
                  street_address={location.street_address}
                  phone={location.phone}
                  website_url={location.website_url}
                />
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link
                href="/states"
                className="inline-flex items-center bg-lavender-500 text-white px-6 py-3 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-lavender-600 transition-all duration-300"
              >
                Browse Complete Directory
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Visit A Cat Cafe?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Cat cafes offer a unique experience combining coffee culture with feline companionship.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-lavender-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Coffee className="h-8 w-8 text-lavender-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Coffee</h3>
              <p className="text-gray-600">
                Enjoy expertly crafted coffee and beverages in a relaxed, cat-friendly environment.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-peach-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Heart className="h-8 w-8 text-peach-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cat Companionship</h3>
              <p className="text-gray-600">
                Spend time with adorable cats while enjoying your favorite drink and snacks.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-mint-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-mint-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cat Adoption Centers</h3>
              <p className="text-gray-600">
                Many cat cafes partner with shelters to help cats find their forever homes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about cat cafes and how to find the perfect one for you.
            </p>
          </div>
          
          <div className="grid gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-lavender-50 to-lavender-100">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-lavender-500 rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <Coffee className="h-5 w-5 text-white" />
                  </div>
                  What is a cat cafe?
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  A cat cafe is a unique establishment that combines a traditional coffee shop with a space where visitors can interact with cats. These cafes typically feature a separate area where cats roam freely, allowing guests to enjoy their coffee, tea, or snacks while spending time with friendly felines.
                </p>
                <div className="bg-lavender-50 rounded-lg p-4 border-l-4 border-lavender-500">
                  <p className="text-sm text-gray-600">
                    <strong>Fun fact:</strong> Cat cafes originated in Taiwan in 1998 and have since become popular worldwide, offering a relaxing environment for cat lovers who may not be able to have pets at home.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-peach-50 to-peach-100">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-peach-500 rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  Is there a cat cafe near me?
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  There's a good chance there is! Cat cafes have been growing in popularity across the United States, with locations in most major cities and many smaller communities. You can use our comprehensive directory to search for cat cafes in your area by entering your city or zip code.
                </p>
                <div className="bg-peach-50 rounded-lg p-4 border-l-4 border-peach-500">
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Quick tip:</strong> We maintain an up-to-date database of cat cafes nationwide, including their locations, hours, and contact information.
                  </p>
                  <Link href="/cat-cafe-near-me" className="inline-flex items-center bg-peach-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-peach-700 transition-colors">
                    <MapPin className="h-4 w-4 mr-2" />
                    Find cat cafes near you
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-mint-50 to-mint-100">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-mint-500 rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <span className="text-white font-bold text-lg">$</span>
                  </div>
                  How much does a cat cafe cost?
                </h3>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Typical Costs:</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-mint-500 rounded-full mr-3"></div>
                        Session fee: $10-$25 per person
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-mint-500 rounded-full mr-3"></div>
                        Duration: 30 minutes to 1 hour
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-mint-500 rounded-full mr-3"></div>
                        Includes: Beverage + cat interaction
                      </li>
                    </ul>
                  </div>
                  <div className="bg-mint-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Special Offers:</h4>
                    <p className="text-sm text-gray-600">
                      Many cafes offer reduced rates for children, students, seniors, and longer sessions. Food and additional beverages available separately.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-lavender-50 to-lavender-100">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-lavender-500 rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  Can I adopt at a cat cafe?
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Yes! Many cat cafes partner with local animal shelters and rescue organizations to facilitate cat adoptions. The cats you meet at cat cafes are often available for adoption, and the cafe serves as a comfortable environment for potential adopters to get to know the cats before making a decision.
                </p>
                <div className="bg-lavender-50 rounded-lg p-4 border-l-4 border-lavender-500">
                  <h4 className="font-semibold text-gray-900 mb-2">Adoption Process:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Fill out an application</li>
                    <li>• Meet with cafe staff or shelter representatives</li>
                    <li>• Pay adoption fee (covers vaccinations & spaying/neutering)</li>
                    <li>• Some cafes offer special adoption events</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-soft-gradient border-t border-lavender-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Find Your Local Cat Cafe?
          </h2>
          <p className="text-xl text-gray-900 mb-8 max-w-2xl mx-auto">
            Browse our comprehensive directory of cat cafes across all 50 states and find the perfect spot near you.
          </p>
          <Link
            href="/states"
            className="inline-flex items-center bg-lavender-500 text-white px-8 py-4 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-lavender-600 transition-all duration-300 mx-auto"
          >
            Find Cat Cafes Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
} 