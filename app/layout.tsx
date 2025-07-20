import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { WebsiteStructuredData, OrganizationStructuredData } from '@/components/StructuredData'
import PerformanceMonitor from "@/components/PerformanceMonitor";
import Script from 'next/script'
import { getStatesWithLocations } from '@/lib/stateUtils'
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Find Local Self Service Car Washes Nationwide',
    description: 'Find the best self service car washes across the U.S. Compare amenities, hours, and ratings. Discover top-rated self service auto wash locations near you, open 24/7 in many areas.',
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
      title: 'Find Local Self Service Car Washes Nationwide',
      siteName: 'Self Service Car Wash Finder',
      images: [
        {
          url: 'https://www.selfcarwashfinder.com/self-car-wash-finder.png',
          width: 1200,
          height: 630,
          alt: 'Find Local Self Service Car Washes Nationwide',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Find Local Self Service Car Washes Nationwide',
      description: 'Discover self service and auto washes locations near you.',
      images: ['https://www.selfcarwashfinder.com/self-car-wash-finder.png'],
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

// Use a Client Component wrapper for layout to access usePathname
function LayoutClient({ children, states }: { children: React.ReactNode, states: any }) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isAdmin = pathname.startsWith('/uGdFNVZYrz9C2D0suy2VjU3Hp');
  return (
    <div className="min-h-screen flex flex-col">
      {!isAdmin && <Header states={states} />}
      <main className="flex-grow">{children}</main>
      {!isAdmin && <Footer />}
    </div>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const GA_MEASUREMENT_ID = 'G-MX6CGQHPNF';
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
        <LayoutClient states={states}>{children}</LayoutClient>
      </body>
    </html>
  )
} 