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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState({ feedback: '', email: '' })
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

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

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingFeedback(true)
    setFeedbackMessage('')
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('location_feedbacks')
        .insert({
          location_id: location.id,
          feedback: feedbackForm.feedback,
          email: feedbackForm.email || null
        })
      if (error) {
        setFeedbackMessage('Error submitting feedback. Please try again.')
      } else {
        setFeedbackMessage('Thank you for your feedback!')
        setFeedbackForm({ feedback: '', email: '' })
        setTimeout(() => setShowFeedbackModal(false), 1500)
      }
    } catch {
      setFeedbackMessage('Error submitting feedback. Please try again.')
    } finally {
      setIsSubmittingFeedback(false)
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

      {/* Hero Section - full-width blue with breadcrumbs and name */}
      <section className="bg-carwash-light-100 pt-12 pb-14 w-full">
        <nav className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-carwash-blue">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/states" className="hover:text-carwash-blue">States</Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/states/${params.state}`} className="hover:text-carwash-blue">{location.state}</Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">{location.name}</li>
          </ol>
        </nav>
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 break-words">{location.name}</h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">Self Service Car Wash in {location.city}, {location.state}</p>
        </div>
      </section>

      {/* Overlap Card for image, rating, address, actions */}
      <section className="relative z-10 -mt-12 mb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Hero Image */}
            {heroImage && (
              <div className="relative h-64 md:h-80 bg-gray-200 overflow-hidden rounded-t-2xl">
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
            {/* Name, Rating, Address, Actions */}
            <div className="px-8 pt-6 pb-2">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    {location.google_rating && (
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 flex items-center shadow">
                        <Star className="h-5 w-5 text-yellow-500 mr-1 fill-current" />
                        <span className="text-lg font-bold text-gray-900">{location.google_rating}</span>
                        {location.review_count && (
                          <span className="text-sm text-gray-600 ml-1">({location.review_count} reviews)</span>
                        )}
                      </div>
                    )}
                  </div>
                  {location.street_address && (
                    <div className="flex items-start mb-2">
                      <MapPin className="h-5 w-5 mr-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900">{location.street_address}</p>
                        <p className="text-gray-600">{location.city}, {location.state} {location.postal_code}</p>
                      </div>
                    </div>
                  )}
                  {location.description && (
                    <p className="text-gray-700 mb-6 leading-relaxed">{location.description}</p>
                  )}
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col w-full lg:w-64 flex-shrink-0 space-y-3 mt-4 lg:mt-0">
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
                  <button
                    type="button"
                    className="w-full px-4 py-3 rounded-lg bg-carwash-light-100 text-carwash-blue font-semibold shadow-sm hover:bg-carwash-light-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-carwash-blue focus:ring-offset-2"
                    onClick={() => setShowFeedbackModal(true)}
                  >
                    Leave Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hours Section */}
        <div className="mb-8">
          <OpenStatus hours={location.location_hours || []} state={location.state} businessStatus={location.business_status} />
        </div>

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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Review Highlights</h2>
            <div className="flex flex-wrap gap-2">
              {location.reviews_tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-carwash-blue text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Self Service Car Washes Section */}
        {location.latitude && location.longitude && (
          <div className="mb-0">
            <NearbyLocationsSection 
              latitude={location.latitude} 
              longitude={location.longitude} 
              currentLocationId={location.id} 
              city={location.city} 
              state={location.state} 
            />
          </div>
        )}
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

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto">
            <div className="sticky top-0 z-10 bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">Leave Feedback</h2>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="px-6 py-6 max-h-[70vh] overflow-y-auto space-y-6">
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Feedback *
                </label>
                <textarea
                  id="feedback"
                  required
                  value={feedbackForm.feedback}
                  onChange={e => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carwash-blue focus:border-transparent min-h-[100px]"
                  placeholder="Let us know if something is wrong, missing, or could be improved."
                />
              </div>
              <div>
                <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  id="feedback-email"
                  value={feedbackForm.email}
                  onChange={e => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carwash-blue focus:border-transparent"
                  placeholder="If you'd like a reply, enter your email"
                />
              </div>
              {feedbackMessage && (
                <div className="p-3 rounded-lg text-sm text-center "
                  style={{ color: feedbackMessage.includes('Thank you') ? '#15803d' : '#dc2626', background: feedbackMessage.includes('Thank you') ? '#f0fdf4' : '#fef2f2' }}>
                  {feedbackMessage}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="bg-carwash-blue text-white px-4 py-2.5 rounded-lg font-medium hover:bg-carwash-blue/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-carwash-blue focus:ring-offset-2"
                >
                  {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 