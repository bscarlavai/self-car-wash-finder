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
        title: `Cat Cafes Near ${zip} | Find Local Cat Cafes & Adoption Spots`,
        description: `Discover cat cafes, adoption centers, and feline-friendly spaces near ${zip}. Get directions, hours, and contact information for local cat cafes.`,
        image,
        url: `https://catcafedirectory.com/cat-cafe-near-me?zip=${zip}`,
      })
      return {
        ...social,
        alternates: {
          canonical: `https://catcafedirectory.com/cat-cafe-near-me?zip=${zip}`,
        },
      }
    } catch (error) {
      // Fallback to default metadata
    }
  }
  // Default metadata for cat-cafe-near-me page
  const locations = await getLocations({})
  const firstLocation = locations && Array.isArray(locations.data) && locations.data.length > 0 ? locations.data[0] : null
  const image = firstLocation && firstLocation.photo_url ? firstLocation.photo_url : null
  
  const social = generateSocialPreview({
    title: 'Cat Cafes Near Me | Find Local Cat Cafes & Adoption Spots',
    description: 'Discover cat cafes, adoption centers, and feline-friendly spaces in your area. Get directions, hours, and contact information for local cat cafes.',
    image,
    url: 'https://catcafedirectory.com/cat-cafe-near-me',
  })
  return {
    ...social,
    alternates: {
      canonical: 'https://catcafedirectory.com/cat-cafe-near-me',
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