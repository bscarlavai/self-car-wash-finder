"use client"

import React, { useMemo } from 'react'
import { searchLocationsByLatLng } from '@/lib/locationUtils'
import LocationCard from '@/components/LocationCard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface NearbyLocationsSectionProps {
  latitude: number
  longitude: number
  currentLocationId: string
  city: string
  state: string
  excludeIds?: string[]
  showBackButton?: boolean
}

async function getNearbyLocations(lat: number, lng: number, currentLocationId: string, excludeIds: string[] = []) {
  const locations = await searchLocationsByLatLng(lat, lng, 25)
  // Exclude the current location and any in excludeIds, then sort by distance (closest first)
  return (locations || [])
    .filter((location: any) => location.id !== currentLocationId && !excludeIds.includes(location.id))
    .sort((a: any, b: any) => (a.distance_miles || 0) - (b.distance_miles || 0))
}

export default function NearbyLocationsSection({ latitude, longitude, currentLocationId, city, state, excludeIds = [], showBackButton = false }: NearbyLocationsSectionProps) {
  const [nearbyLocations, setNearbyLocations] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  // Memoize excludeIds string for stable dependency
  const excludeIdsString = useMemo(() => JSON.stringify([...excludeIds].sort()), [excludeIds])

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    // Defensive: only fetch if lat/lng are valid numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
      setNearbyLocations([])
      setLoading(false)
      return
    }
    getNearbyLocations(latitude, longitude, currentLocationId, excludeIds).then(locations => {
      if (mounted) {
        setNearbyLocations(locations)
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [latitude, longitude, currentLocationId, excludeIdsString])

  if (loading) return null

  return (
    <section className="w-full bg-carwash-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Self Service Car Washes Near {city}, {state}
        </h2>
        {nearbyLocations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {nearbyLocations.map((location) => (
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
                distance_miles={location.distance_miles}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600">
            <p>No additional car washes found nearby.</p>
          </div>
        )}
        {showBackButton && (
          <div className="w-full text-center pt-8">
            <Link
              href={`/states/${state.toLowerCase().replace(/\s+/g, '-')}`}
              className="inline-flex items-center bg-carwash-blue text-white px-6 py-3 rounded-lg font-semibold shadow-soft hover:shadow-soft-hover hover:bg-carwash-blue/90 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {state} Self Service Car Washes
            </Link>
          </div>
        )}
      </div>
    </section>
  )
} 