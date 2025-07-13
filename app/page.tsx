import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, DollarSign, Bubbles, Calendar, ToolCase, ArrowRight, Star } from 'lucide-react'
import { getLocations, getSupabaseClient } from '@/lib/supabase'
import { generateSocialPreview } from '@/components/SocialPreview'
import LocationCard from '@/components/LocationCard'
import { getOpen24HourLocationCount } from '@/lib/stateUtils'
import TopStatesSection from '@/components/TopStatesSection';

export async function generateMetadata(): Promise<Metadata> {
  return generateSocialPreview({
    title: 'Self Service Car Wash Finder - Find Local Self Service Car Washes Nationwide',
    description: 'Find the best self service car washes across the U.S. Explore nearby self car wash and self service auto wash locations in your area.',
  })
}

async function getFeaturedLocations() {
  try {
    const supabase = getSupabaseClient()
    
    // Get all locations with ratings and review counts
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
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
    // Use shared util for open 24 hours count
    const open24HoursCount = await getOpen24HourLocationCount();
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

export default async function HomePage() {
  const [featuredLocations, stats] = await Promise.all([
    getFeaturedLocations(),
    getStats()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-carwash-light-100 pt-20 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Find A Self Service Car Wash
              <br />
              <span className="text-2xl md:text-3xl font-normal text-gray-700">In the United States</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover convenient self-service car washes across the United States where you can wash your car 
              with professional equipment on your own schedule.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-2">
              <Link
                href="/states"
                className="bg-tarawera text-white px-8 py-4 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-carwash-blue transition-all duration-300 flex justify-center items-center"
              >
                Explore All States
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#featured"
                className="bg-white border-2 border-tarawera text-tarawera px-8 py-4 rounded-lg font-semibold hover:bg-tarawera hover:text-white transition-colors shadow-soft"
              >
                See Top-Rated Car Washes
              </Link>
            </div>
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
              <div className="text-4xl font-bold text-yellow-500 mb-2">{stats.highRatedCount}</div>
              <div className="text-gray-600">4+ Star Rated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Car Washes */}
      {featuredLocations.length > 0 && (
        <section id="featured" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Top-Rated Self Service Car Washes
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover the highest-rated self-service car washes across the country, 
                featuring real reviews and curated information.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {featuredLocations.map((location: any) => (
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
            
            <div className="text-center mt-12">
              <Link
                href="/states"
                className="inline-flex items-center bg-tarawera text-white px-6 py-3 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-carwash-blue transition-all duration-300"
              >
                Browse Complete Directory
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-carwash-light-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Self Service Car Washes?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Self-service car washes offer convenience, control, and cost-effectiveness for keeping your vehicle clean.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-carwash-blue/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Bubbles className="h-8 w-8 text-carwash-blue" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional Equipment</h3>
              <p className="text-gray-600">
                Access high-quality car wash equipment and supplies for a thorough cleaning.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-carwash-light/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-tarawera" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Convenience & Control</h3>
              <p className="text-gray-600">
                Wash your car on your own schedule with full control over the cleaning process.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-tarawera/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-tarawera" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cost Effective</h3>
              <p className="text-gray-600">
                Save money compared to full-service car washes while getting professional results.
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
              Everything you need to know about self-service car washes and how to find the perfect one for you.
            </p>
          </div>
          
          <div className="grid gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-carwash-blue/5">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-carwash-blue rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <Bubbles className="h-5 w-5 text-white" />
                  </div>
                  What is a self-service car wash?
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  A self-service car wash is a facility where you can wash your own vehicle using professional equipment and supplies. These locations typically feature high-pressure washers, soap dispensers, wax applicators, and vacuum stations, allowing you to clean your car thoroughly on your own schedule.
                </p>
                <div className="bg-carwash-blue/5 rounded-lg p-4 border-l-4 border-carwash-blue">
                  <p className="text-sm text-gray-600">
                    <strong>Fun fact:</strong> Self-service car washes became popular in the 1950s and offer a cost-effective alternative to full-service car washes while giving you complete control over the cleaning process.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-carwash-light/5">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-carwash-light rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  Is there a self-service car wash near me?
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  There's a good chance there is! Self-service car washes are widely available across the United States, with locations in most cities and towns. You can use our comprehensive directory to search for self-service car washes in your area by entering your city or zip code.
                </p>
                <div className="bg-carwash-light/5 rounded-lg p-4 border-l-4 border-carwash-light">
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Quick tip:</strong> We maintain an up-to-date database of self-service car washes nationwide, including their locations, hours, and contact information.
                  </p>
                  <Link href="/self-service-car-wash-near-me" className="inline-flex items-center bg-carwash-light text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-carwash-blue transition-colors">
                    <MapPin className="h-4 w-4 mr-2" />
                    Find self-service car washes near you
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-tarawera/5">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-tarawera rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  How much does a self-service car wash cost?
                </h3>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Typical Costs:</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-tarawera rounded-full mr-3"></div>
                        Basic wash: $3-$8 per session
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-tarawera rounded-full mr-3"></div>
                        Duration: 10-20 minutes
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-tarawera rounded-full mr-3"></div>
                        Includes: Soap, rinse, and basic cleaning
                      </li>
                    </ul>
                  </div>
                  <div className="bg-tarawera/5 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Special Offers:</h4>
                    <p className="text-sm text-gray-600">
                      Many locations offer additional services like waxing, tire cleaning, and interior vacuuming for extra fees. Some offer loyalty programs and bulk discounts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-carwash-blue/5">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-10 h-10 bg-carwash-blue rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <ToolCase className="h-5 w-5 text-white" />
                  </div>
                  What equipment is available at self-service car washes?
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Self-service car washes typically offer a variety of professional equipment including high-pressure washers, foam brushes, soap dispensers, wax applicators, tire cleaners, and vacuum stations. Most locations also provide towels and other cleaning supplies for a complete car wash experience.
                </p>
                <div className="bg-carwash-blue/5 rounded-lg p-4 border-l-4 border-carwash-blue">
                  <h4 className="font-semibold text-gray-900 mb-2">Available Equipment:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• High-pressure water sprayers</li>
                    <li>• Foam brushes and soap dispensers</li>
                    <li>• Wax and sealant applicators</li>
                    <li>• Tire and wheel cleaners</li>
                    <li>• Interior vacuum stations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-carwash-light-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Find Your Local Self Service Car Wash?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Browse our comprehensive directory of self-service car washes across all 50 states and find the perfect spot near you.
          </p>
          <Link
            href="/states"
            className="inline-flex items-center bg-tarawera text-white px-8 py-4 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-carwash-blue transition-all duration-300 mx-auto"
          >
            Find Self Service Car Washes Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
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
          <TopStatesSection limit={3} />
        </div>
      </section>
    </div>
  )
} 