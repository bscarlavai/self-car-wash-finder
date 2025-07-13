'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Phone, Clock, Star, Navigation, Heart, Calendar, Coffee, Wifi, Car, Users, CreditCard, Baby, X } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { LocalBusinessStructuredData, BreadcrumbStructuredData } from '@/components/StructuredData'
import OpenStatus from '@/components/OpenStatus'
import { formatHours } from '@/lib/timeUtils'
import { getDetailPageImage } from '@/lib/imageUtils'
import React from 'react'
import dynamic from 'next/dynamic'
import AmenitiesSummaryAndDetails from '@/components/AmenitiesSummaryAndDetails'
import { useAnalytics } from '@/lib/analytics'

const NearbyLocationsSection = dynamic(() => import('@/components/NearbyLocationsSection'), { ssr: false })

// Helper function to get appropriate icon for each category
function getCategoryIcon(category: string) {
  const iconMap: { [key: string]: JSX.Element } = {
    'Service options': <Coffee className="h-5 w-5 text-carwash-blue" />,
    'Highlights': <Star className="h-5 w-5 text-carwash-blue" />,
    'Offerings': <Coffee className="h-5 w-5 text-carwash-blue" />,
    'Dining options': <Coffee className="h-5 w-5 text-carwash-blue" />,
    'Amenities': <Wifi className="h-5 w-5 text-carwash-blue" />,
    'Atmosphere': <Heart className="h-5 w-5 text-carwash-blue" />,
    'Crowd': <Users className="h-5 w-5 text-carwash-blue" />,
    'Planning': <Calendar className="h-5 w-5 text-carwash-blue" />,
    'Payments': <CreditCard className="h-5 w-5 text-carwash-blue" />,
    'Children': <Baby className="h-5 w-5 text-carwash-blue" />,
    'Parking': <Car className="h-5 w-5 text-carwash-blue" />,
    'Other': <Star className="h-5 w-5 text-carwash-blue" />,
  };
  
  return iconMap[category] || <Star className="h-5 w-5 text-carwash-blue" />;
}

export default function LocationPageClient({ location: initialLocation, params }: { location: any, params: any }) {
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimForm, setClaimForm] = useState({ name: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [claimMessage, setClaimMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [location, setLocation] = useState(initialLocation)
  const { trackCafeButtonClick } = useAnalytics()

  const htmlSnippet = `<a href="https://www.selfcarwashfinder.com/states/${params.state}/${params.city}/${params.slug}" target="_blank" rel="noopener noreferrer">
  <img src="https://www.selfcarwashfinder.com/self-car-wash-finder.png" alt="Verified by Self Service Car Wash Finder" style="height: 64px; width: auto;">
</a>`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(htmlSnippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setClaimMessage('')

    // Track the submit claim event
    trackCafeButtonClick('submit_claim', location.name, `${location.city}, ${location.state}`, {
      claimer_name: claimForm.name,
      claimer_email: claimForm.email
    })

    try {
      const supabase = getSupabaseClient()
      
      // Insert the claim record
      const { error: claimError } = await supabase
        .from('location_claims')
        .insert({
          location_id: location.id,
          name: claimForm.name,
          email: claimForm.email
        })

      if (claimError) {
        if (claimError.code === '23505') { // Unique constraint violation
          setClaimMessage('A claim has already been submitted for this location.')
        } else {
          setClaimMessage('Error submitting claim. Please try again.')
        }
        return
      }

      // Update the location's claimed_status to "pending"
      const { error: updateError } = await supabase
        .from('locations')
        .update({ claimed_status: 'pending' })
        .eq('id', location.id)

      if (updateError) {
        console.error('Error updating location status:', updateError)
        setClaimMessage('Claim submitted, but there was an issue updating the status. Please contact support.')
      } else {
        // Update local state to reflect the new claimed_status
        setLocation((prevLocation: any) => ({
          ...prevLocation,
          claimed_status: 'pending'
        }))
        setClaimMessage('Claim submitted successfully! We will review your submission and contact you soon.')
        setShowClaimModal(false)
        setClaimForm({ name: '', email: '' })
      }
    } catch (error) {
      setClaimMessage('Error submitting claim. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get optimized images for different use cases
  const heroImage = getDetailPageImage(location)

  // Group amenities by category
  const amenitiesByCategory = location.location_amenities?.reduce((acc: { [key: string]: string[] }, amenity: any) => {
    if (!acc[amenity.amenity_category]) {
      acc[amenity.amenity_category] = []
    }
    acc[amenity.amenity_category].push(amenity.amenity_name)
    return acc
  }, {}) || {}

  // Sort amenities within each category alphabetically
  Object.keys(amenitiesByCategory).forEach(category => {
    amenitiesByCategory[category].sort()
  })

  // Get sorted categories for display
  const sortedCategories = Object.keys(amenitiesByCategory).sort()

  // Format hours for display
  const formattedHours = formatHours(location.location_hours || [])

  // Breadcrumb items for structured data
  const breadcrumbItems = [
    { name: 'Home', url: 'https://www.selfcarwashfinder.com' },
    { name: 'States', url: 'https://www.selfcarwashfinder.com/states' },
    { name: location.state, url: `https://www.selfcarwashfinder.com/states/${params.state}` },
    { name: location.city, url: `https://www.selfcarwashfinder.com/states/${params.state}/${params.city}` },
    { name: location.name, url: `https://www.selfcarwashfinder.com/states/${params.state}/${params.city}/${params.slug}` }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <LocalBusinessStructuredData location={location} />
      <BreadcrumbStructuredData items={breadcrumbItems} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 sm:text-base">
            <li className="whitespace-nowrap">
              <Link href="/states" className="hover:text-carwash-blue">
                States
              </Link>
            </li>
            <li className="select-none">/</li>
            <li className="whitespace-nowrap">
              <Link href={`/states/${params.state}`} className="hover:text-carwash-blue">
                {location.state}
              </Link>
            </li>
            <li className="select-none">/</li>
            <li className="text-gray-900 font-medium whitespace-nowrap break-all">{location.name}</li>
          </ol>
        </nav>

        {/* Cafe Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {/* Hero Image */}
          {heroImage && (
            <div className="relative h-64 md:h-80 bg-gray-200 overflow-hidden">
              <img
                src={heroImage}
                alt={`${location.name} self service car wash in ${location.city}, ${location.state}`}
                className="w-full h-full object-cover"
                loading="eager"
                width={800}
                height={400}
              />
            </div>
          )}
          {/* Cafe Name, Location, and Review Badge below image */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-8 pt-6 pb-2">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 break-words">
                {location.name}
                <span className="block font-normal text-lg text-gray-600">
                  Self Service Car Wash in {location.city}, {location.state}
                </span>
              </h1>
            </div>
            {location.google_rating && (
              <div className="flex-shrink-0">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 flex items-center shadow">
                  <Star className="h-5 w-5 text-yellow-500 mr-1 fill-current" />
                  <span className="text-lg font-bold text-gray-900">{location.google_rating}</span>
                  {location.review_count && (
                    <span className="text-sm text-gray-600 ml-1">({location.review_count} reviews)</span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  {/* Reimplement this later {location.claimed_status === 'claimed' && (
                    <div className="flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <img 
                        src="/self-car-wash-finder.png" 
                        alt="Verified by Self Service Car Wash Finder" 
                        className="h-12 w-12 mr-1"
                      />
                      <span>Claimed</span>
                    </div>
                  )}
                  {location.claimed_status === 'pending' && (
                    <div className="flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Claim Pending Review</span>
                    </div>
                  )}
                  {(!location.claimed_status || location.claimed_status === 'unclaimed') && (
                    <button
                      onClick={() => {
                        trackCafeButtonClick('claim_listing', location.name, `${location.city}, ${location.state}`)
                        setShowClaimModal(true)
                      }}
                      className="flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-carwash-blue text-white hover:bg-carwash-blue/90 transition-colors focus:outline-none focus:ring-2 focus:ring-carwash-blue focus:ring-offset-1"
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>Claim This Listing</span>
                    </button>
                  )} */}
                </div>

                {location.description && (
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {location.description}
                  </p>
                )}

                <div className="space-y-3">
                  {location.street_address && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900">{location.street_address}</p>
                        <p className="text-gray-600">{location.city}, {location.state} {location.postal_code}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* {location.phone && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" />
                      <a href={`tel:${location.phone}`} className="text-gray-900 hover:text-lavender-600">
                        {location.phone}
                      </a>
                    </div>
                  )}

                  {location.website_url && (
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" />
                      <a 
                        href={location.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-900 hover:text-lavender-600"
                      >
                        Visit Website
                      </a>
                    </div>
                  )} */}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 lg:mt-0 lg:ml-8 space-y-3 my-6">
                {location.latitude && location.longitude && (
                  <a
                    href={location.location_url || `https://maps.google.com/?q=${encodeURIComponent(location.name + ' ' + (location.street_address || '') + ' ' + location.city + ' ' + location.state)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCafeButtonClick('get_directions', location.name, `${location.city}, ${location.state}`)}
                    className="group flex items-center w-full px-4 py-3 rounded-lg bg-carwash-blue shadow-sm hover:shadow-md hover:bg-carwash-blue/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-carwash-blue focus:ring-offset-2"
                  >
                    <Navigation className="h-5 w-5 mr-2.5 text-white transition-transform group-hover:scale-105" />
                    <span className="font-medium text-white">Get Directions</span>
                  </a>
                )}
                
                {location.phone && (
                  <a
                    href={`tel:${location.phone}`}
                    onClick={() => trackCafeButtonClick('call_now', location.name, `${location.city}, ${location.state}`)}
                    className="group flex items-center w-full px-4 py-3 rounded-lg bg-carwash-blue shadow-sm hover:shadow-md hover:bg-carwash-blue/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-carwash-blue focus:ring-offset-2"
                  >
                    <Phone className="h-5 w-5 mr-2.5 text-white transition-transform group-hover:scale-105" />
                    <span className="font-medium text-white">Call Now</span>
                  </a>
                )}

                {location.booking_appointment_url && (
                  <a
                    href={location.booking_appointment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCafeButtonClick('book_appointment', location.name, `${location.city}, ${location.state}`)}
                    className="group flex items-center w-full px-4 py-3 rounded-lg bg-carwash-blue shadow-sm hover:shadow-md hover:bg-carwash-blue/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-carwash-blue focus:ring-offset-2"
                  >
                    <Calendar className="h-5 w-5 mr-2.5 text-white transition-transform group-hover:scale-105" />
                    <span className="font-medium text-white">Book Appointment</span>
                  </a>
                )}

                {location.reservation_urls && location.reservation_urls.length > 0 && (
                  <a
                    href={location.reservation_urls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCafeButtonClick('make_reservation', location.name, `${location.city}, ${location.state}`)}
                    className="group flex items-center w-full px-4 py-3 rounded-lg bg-carwash-blue shadow-sm hover:shadow-md hover:bg-carwash-blue/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-carwash-blue focus:ring-offset-2"
                  >
                    <Calendar className="h-5 w-5 mr-2.5 text-white transition-transform group-hover:scale-105" />
                    <span className="font-medium text-white">Make Reservation</span>
                  </a>
                )}

                {location.menu_url && (
                  <a
                    href={location.menu_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCafeButtonClick('view_menu', location.name, `${location.city}, ${location.state}`)}
                    className="group flex items-center w-full px-4 py-3 rounded-lg bg-carwash-blue shadow-sm hover:shadow-md hover:bg-carwash-blue/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-carwash-blue focus:ring-offset-2"
                  >
                    <Coffee className="h-5 w-5 mr-2.5 text-white transition-transform group-hover:scale-105" />
                    <span className="font-medium text-white">View Menu</span>
                  </a>
                )}

                {location.order_urls && location.order_urls.length > 0 && (
                  <a
                    href={location.order_urls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCafeButtonClick('order_online', location.name, `${location.city}, ${location.state}`)}
                    className="group flex items-center w-full px-4 py-3 rounded-lg bg-carwash-blue shadow-sm hover:shadow-md hover:bg-carwash-blue/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-carwash-blue focus:ring-offset-2"
                  >
                    <Coffee className="h-5 w-5 mr-2.5 text-white transition-transform group-hover:scale-105" />
                    <span className="font-medium text-white">Order Online</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hours Section */}
        {formattedHours.length > 0 && (
          <div className="mb-8">
            <OpenStatus hours={location.location_hours || []} state={location.state} businessStatus={location.business_status} />
          </div>
        )}

        {/* Amenities Section */}
        {Object.keys(amenitiesByCategory).length > 0 && (
          <AmenitiesSummaryAndDetails 
            amenitiesByCategory={amenitiesByCategory} 
            sortedCategories={sortedCategories} 
          />
        )}

        {/* Reviews Tags Section */}
        {location.reviews_tags && location.reviews_tags.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What Reviews Say</h2>
            <div className="flex flex-wrap gap-2">
              {location.reviews_tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-carwash-blue text-white hover:bg-carwash-blue/90 transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Self Service Car Washes Section */}
        {location.latitude && location.longitude && (
          <NearbyLocationsSection 
            latitude={location.latitude} 
            longitude={location.longitude} 
            currentLocationId={location.id} 
            city={location.city} 
            state={location.state} 
          />
        )}

        {/* Related Cafes Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">More Self Service Car Washes in {location.state}</h2>
          <p className="text-gray-600 text-center mb-8">
            Discover other amazing self service car washes and auto wash stations in {location.state}
          </p>
          <div className="text-center py-8">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <MapPin className="h-12 w-12 text-carwash-blue mx-auto mb-4" />
                <p className="text-gray-600">
                  Discover other amazing self service car washes and auto wash stations in {location.state}
                </p>
              </div>
              <div className="space-y-3">
                <Link
                  href={`/states/${params.state}`}
                  className="inline-flex items-center justify-center w-full bg-carwash-blue text-white px-4 py-3 rounded-lg font-medium shadow-sm hover:shadow-md hover:bg-carwash-blue/90 transition-all duration-200"
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Browse All Car Washes in {location.state}
                </Link>
                <Link
                  href="/states"
                  className="inline-flex items-center justify-center w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Explore All States
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">Claim Your Listing</h2>
              <button
                onClick={() => setShowClaimModal(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {/* Modal Content */}
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                <div>                  
                  <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <div className="mb-4">
                      {/* Preview */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <div className="flex items-center justify-center">
                          <div 
                            className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                            dangerouslySetInnerHTML={{
                              __html: htmlSnippet
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Code Block */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">HTML Code:</p>
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-carwash-blue text-white text-sm rounded-lg hover:bg-carwash-blue/90 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-carwash-blue text-sm leading-relaxed">
                          <code>{htmlSnippet}</code>
                        </pre>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-carwash-blue text-white rounded-lg">
                      <p className="text-sm">
                        Copy this code and paste it into your website's HTML. Then submit your name and email and we'll confirm your ownership.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleClaimSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={claimForm.name}
                      onChange={(e) => setClaimForm({ ...claimForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carwash-blue focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={claimForm.email}
                      onChange={(e) => setClaimForm({ ...claimForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carwash-blue focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  </div>

                  {claimMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      claimMessage.includes('successfully') 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {claimMessage}
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-carwash-blue text-white px-4 py-2.5 rounded-lg font-medium hover:bg-carwash-blue/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-carwash-blue focus:ring-offset-2"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClaimModal(false)}
                      className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 