import { Metadata } from 'next'

interface SocialPreviewProps {
  title: string
  description: string
  image?: string | null
  url?: string
  type?: 'website' | 'article'
}

export function generateSocialPreview({
  title,
  description,
  image = '/self-car-wash-finder.png', // Default to site logo
  url = 'https://www.selfcarwashfinder.com',
  type = 'website'
}: SocialPreviewProps): Metadata {
  // Use provided image or fallback to site logo
  const imageToUse = image || '/self-car-wash-finder.png'
  
  // Ensure image URL is absolute
  const imageUrl = imageToUse.startsWith('http') ? imageToUse : `https://www.selfcarwashfinder.com${imageToUse}`
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Self Service Car Wash Finder',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@selfcarwashfinder', // Optional: your Twitter handle
    },
  }
} 