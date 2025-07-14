"use client"

import React from 'react'
import { searchLocationsByLatLng } from '@/lib/locationUtils'
import { getShopCardImage } from '@/lib/imageUtils'
import { Star } from 'lucide-react'
// @ts-ignore
import slugify from '@/lib/slugify'

interface NearbyLocationsSectionProps {
  latitude: number
  longitude: number
  currentLocationId: string
  city: string
  state: string
  excludeIds?: string[]
}

async function getNearbyLocations(lat: number, lng: number, currentLocationId: string, excludeIds: string[] = []) {
  const locations = await searchLocationsByLatLng(lat, lng, 25)
  // Exclude the current location and any in excludeIds, then sort by distance (closest first)
  return (locations || [])
    .filter((location: any) => location.id !== currentLocationId && !excludeIds.includes(location.id))
    .sort((a: any, b: any) => a.distance - b.distance)
}

function formatDistance(miles: number) {
  if (!miles) return ''
  if (miles < 1) return `${Math.round(miles * 5280)} ft`
  return `${miles.toFixed(1)} mi`
}

export default function NearbyLocationsSection({ latitude, longitude, currentLocationId, city, state, excludeIds = [] }: NearbyLocationsSectionProps) {
  const [nearbyLocations, setNearbyLocations] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    getNearbyLocations(latitude, longitude, currentLocationId, excludeIds).then(locations => {
      if (mounted) {
        setNearbyLocations(locations)
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [latitude, longitude, currentLocationId, JSON.stringify(excludeIds)])

  if (loading) return null
  if (!nearbyLocations.length) return null

  return (
    <div className="bg-white rounded-lg shadow-md p-8 mb-8 mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Self Service Car Washes Near {city}, {state}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {nearbyLocations.map((location) => (
          <a
            key={location.id}
            href={`/states/${slugify(location.state)}/${slugify(location.city)}/${location.slug}`}
            className="block bg-gray-50 rounded-lg shadow hover:shadow-lg transition p-4 h-full"
          >
            <div className="h-32 w-full bg-gray-200 rounded mb-3 overflow-hidden flex items-center justify-center">
              {getShopCardImage(location) ? (
                <img
                  src={getShopCardImage(location)!}
                  alt={location.name}
                  className="object-cover w-full h-full"
                  width={300}
                  height={128}
                  loading="lazy"
                />
              ) : (
                <div className="text-gray-400">No Image</div>
              )}
            </div>
            <div className="font-semibold text-lg text-gray-900 break-words">{location.name}</div>
            <div className="text-gray-600 text-sm">{location.city}, {location.state}</div>
            {location.distance && (
              <div className="text-xs text-gray-500 mt-1">{formatDistance(location.distance)} away</div>
            )}
            {location.google_rating && (
              <div className="flex items-center text-yellow-600 text-sm mt-1">
                <Star className="h-4 w-4 mr-1 fill-current" />
                {location.google_rating}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  )
} 