import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { WebsiteStructuredData, OrganizationStructuredData } from '@/components/StructuredData'
import PerformanceMonitor from "@/components/PerformanceMonitor";
import Script from 'next/script'
import { getLocations } from '@/lib/supabase'
import { getStatesWithLocations } from '@/lib/stateUtils'

const inter = Inter({ subsets: ['latin'] })

async function getFeaturedCafeImage() {
  try {
    const { data, error } = await getLocations()
      .not('google_rating', 'is', null)
      .not('photo_url', 'is', null)
      .order('google_rating', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return null
    }

    return data.photo_url
  } catch (error) {
    console.error('Error fetching featured cafe image:', error)
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const featuredImage = await getFeaturedCafeImage()
  
  return {
    title: 'Cat Cafe Directory - Find Local Cat Cafes Nationwide',
    description: 'Discover the best cat cafes across the United States. Find adoption centers, cat cafes, and feline-friendly spaces near you.',
    keywords: 'cat cafe, cat cafes, cat adoption, cat cafe directory, cat cafe near me, cat cafe USA',
    authors: [{ name: 'Cat Cafe Directory' }],
    creator: 'Cat Cafe Directory',
    publisher: 'Cat Cafe Directory',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL('https://catcafedirectory.com'),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://catcafedirectory.com',
      title: 'Cat Cafe Directory - Find Local Cat Cafes Nationwide',
      description: 'Discover the best cat cafes across the United States. Find adoption centers, cat cafes, and feline-friendly spaces near you.',
      siteName: 'Cat Cafe Directory',
      images: featuredImage ? [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: 'Featured Cat Cafe - Cat Cafe Directory',
        },
      ] : [
        {
          url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=630&fit=crop&crop=center',
          width: 1200,
          height: 630,
          alt: 'Cat Cafe Directory - Find Local Cat Cafes Nationwide',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Cat Cafe Directory - Find Local Cat Cafes Nationwide',
      description: 'Discover the best cat cafes across the United States. Find adoption centers, cat cafes, and feline-friendly spaces near you.',
      images: featuredImage ? [featuredImage] : ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=630&fit=crop&crop=center'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: 'https://catcafedirectory.com',
    },
    verification: {
      google: 'your-google-verification-code',
      yandex: 'your-yandex-verification-code',
      yahoo: 'your-yahoo-verification-code',
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const GA_MEASUREMENT_ID = 'G-8H6R8Z2NYX';
  const gtagScript = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  `;

  // Fetch states with cafes for the header dropdown
  const states = await getStatesWithLocations()

  return (
    <html lang="en">
      <head>
        <WebsiteStructuredData />
        <OrganizationStructuredData />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="icon" type="image/svg+xml" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <PerformanceMonitor />
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {gtagScript}
        </Script>
      </head>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Header states={states} />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
} 