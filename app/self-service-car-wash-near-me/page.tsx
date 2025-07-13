import { Metadata } from 'next'
import { Suspense } from 'react'
import NearMeClient from '@/components/NearMeClient'
import { generateSocialPreview } from '@/components/SocialPreview'
import { getLocations } from '@/lib/supabase'

interface PageProps {
  searchParams: {
    zip?: string
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const zip = searchParams.zip
  
  if (zip) {
    // Try to get locations near this zip code for a more relevant preview
    try {
      const locations = await getLocations({})
      const firstLocation = locations && Array.isArray(locations.data) && locations.data.length > 0 ? locations.data[0] : null
      const image = firstLocation && firstLocation.photo_url ? firstLocation.photo_url : null
      
      const social = generateSocialPreview({
        title: `Self Service Car Washes Near ${zip} | Find Local Self Service Car Washes`,
        description: `Explore self-service car washes and auto wash stations near ${zip}. Get directions, hours, and contact details for local self-serve car wash locations.`,
        image,
        url: `https://www.selfcarwashfinder.com/self-service-car-wash-near-me?zip=${zip}`,
      })
      return {
        ...social,
        alternates: {
          canonical: `https://www.selfcarwashfinder.com/self-service-car-wash-near-me?zip=${zip}`,
        },
      }
    } catch (error) {
      // Fallback to default metadata
    }
  }
  // Default metadata for self-service-car-wash-near-me page
  const social = generateSocialPreview({
    title: 'Self Service Car Wash Near Me | Find Local Self Service Car Washes',
    description: 'Explore self-service car washes and auto wash stations in your area. Get directions, hours, and contact details for local self-serve car wash locations.',
    url: 'https://www.selfcarwashfinder.com/self-service-car-wash-near-me',
  })
  return {
    ...social,
    alternates: {
      canonical: 'https://www.selfcarwashfinder.com/self-service-car-wash-near-me',
    },
  }
}

export default function NearMePage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500">Loading...</div>}>
      <NearMeClient />
    </Suspense>
  )
} 