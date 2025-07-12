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
  image = '/og-default.jpg', // Default image
  url = 'https://catcafedirectory.com',
  type = 'website'
}: SocialPreviewProps): Metadata {
  // Handle null image by using default
  const imageToUse = image || '/og-default.jpg'
  
  // Ensure image URL is absolute
  const imageUrl = imageToUse.startsWith('http') ? imageToUse : `https://catcafedirectory.com${imageToUse}`
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Cat Cafe Directory',
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
      creator: '@catcafedirectory', // Optional: your Twitter handle
    },
  }
} 