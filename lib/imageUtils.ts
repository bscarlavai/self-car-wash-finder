// Utility functions for handling images in social media previews

// Function to get optimized image for different use cases
// Uses original Google images when possible to maintain quality
export function getOptimizedImage(
  originalUrl: string,
  useCase: 'thumbnail' | 'hero' | 'social' | 'full' = 'thumbnail'
): string {
  if (!originalUrl || !originalUrl.includes('googleusercontent.com')) {
    return originalUrl
  }

  // For better quality, use original Google images with size parameters
  // Google Places URLs can be modified to request specific sizes
  const googleUrl = new URL(originalUrl)
  
  // Google Places image size parameters
  const sizes = {
    thumbnail: '=w300-h200-c',    // 300x200
    hero: '=w800-h400-c',         // 800x400  
    social: '=w1200-h630-c',      // 1200x630
    full: '=w1200-h800-c'         // 1200x800
  }
  
  // Add size parameter to Google URL
  const sizeParam = sizes[useCase]
  if (googleUrl.pathname.includes('=')) {
    // URL already has size parameters, replace them
    googleUrl.pathname = googleUrl.pathname.replace(/=w\d+-h\d+-c.*$/, sizeParam)
  } else {
    // Add size parameters
    googleUrl.pathname += sizeParam
  }
  
  return googleUrl.toString()
}

// Fallback function using images.weserv.nl if Google sizing doesn't work
export function optimizeGoogleImage(
  originalUrl: string,
  width: number = 800,
  height: number = 600,
  quality: number = 95
): string {
  if (!originalUrl || !originalUrl.includes('googleusercontent.com')) {
    return originalUrl
  }

  // Only use images.weserv.nl as a fallback for very specific cases
  // This maintains better quality by using Google's native sizing when possible
  const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&w=${width}&h=${height}&q=${quality}&output=jpg&we&fit=outside&trim=1`
  
  return proxyUrl
}

// Function to generate a dynamic image URL for cafes without photos
export function generateCafeImageUrl(cafeName: string, city: string, state: string): string {
  // You could use a service like Cloudinary, Imgix, or similar to generate dynamic images
  // For now, we'll use the default image
  return '/og-default.jpg'
}

// Function to check if an image URL is valid and accessible
export async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const contentType = response.headers.get('content-type')
    return response.ok && contentType !== null && contentType.startsWith('image/')
  } catch {
    return false
  }
}

// Function to get image dimensions (useful for aspect ratio optimization)
export async function getImageDimensions(url: string): Promise<{ width: number; height: number } | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => resolve(null)
      img.src = URL.createObjectURL(blob)
    })
  } catch {
    return null
  }
}

// Function to get the best image for shop cards (prioritizes street view for location recognition)
export function getShopCardImage(cafe: { street_view_url?: string; logo_url?: string; photo_url?: string }): string | null {
  // Priority: street_view_url > photo_url > logo_url
  if (cafe.street_view_url) {
    return cafe.street_view_url;
  }
  if (cafe.photo_url) {
    return cafe.photo_url;
  }
  if (cafe.logo_url) {
    return cafe.logo_url;
  }
  return null;
}

// Function to get the best image for detail pages (prioritizes street view, then interior photos)
export function getDetailPageImage(cafe: { photo_url?: string; street_view_url?: string; logo_url?: string }): string | null {
  // Priority: street_view_url > photo_url > logo_url
  if (cafe.street_view_url) {
    return cafe.street_view_url;
  }
  if (cafe.photo_url) {
    return cafe.photo_url;
  }
  if (cafe.logo_url) {
    return cafe.logo_url;
  }
  return null;
} 