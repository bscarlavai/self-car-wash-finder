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

async function getFeaturedImage() {
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
    console.error('Error fetching featured image:', error)
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const featuredImage = await getFeaturedImage()
  
  return {
    title: 'Self Service Car Wash Finder - Find Local Self Service Car Washes Nationwide',
    description: 'Discover the best self-service car washes across the United States. Find self-service car washes, auto washes, and car wash locations near you.',
    keywords: 'self service car wash, self service car wash near me, self serve auto wash, local self serve car wash, self car wash near me',
    authors: [{ name: 'Self Service Car Wash Finder' }],
    creator: 'Self Service Car Wash Finder',
    publisher: 'Self Service Car Wash Finder',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL('https://www.selfcarwashfinder.com'),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://www.selfcarwashfinder.com',
      title: 'Self Service Car Wash Finder - Find Local Self Service Car Washes Nationwide',
      description: 'Discover the best self-service car washes across the United States. Find self-service car washes, auto washes, and car wash locations near you.',
      siteName: 'Self Service Car Wash Finder',
      images: featuredImage ? [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: 'Featured Self Service Car Wash - Self Service Car Wash Finder',
        },
      ] : [
        {
          url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&h=630&fit=crop&crop=center',
          width: 1200,
          height: 630,
          alt: 'Self Service Car Wash Finder - Find Local Self Service Car Washes Nationwide',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Self Service Car Wash Finder - Find Local Self Service Car Washes Nationwide',
      description: 'Discover the best self-service car washes across the United States. Find self-service car washes, auto washes, and car wash locations near you.',
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
      canonical: 'https://www.selfcarwashfinder.com',
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

  // Fetch states with car washes for the header dropdown
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