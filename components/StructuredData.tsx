import Script from 'next/script'
import type { BusinessHour } from '@/lib/timeUtils'

interface StructuredDataProps {
  type: 'website' | 'organization' | 'localBusiness' | 'breadcrumbList'
  data: Record<string, unknown>
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  }

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// Website structured data for homepage
export function WebsiteStructuredData() {
  const data = {
    name: 'Cat Cafe Directory',
    description: 'Discover the best cat cafes across the United States. Find adoption centers, cat cafes, and feline-friendly spaces near you.',
    url: 'https://catcafedirectory.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://catcafedirectory.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  }

  return <StructuredData type="website" data={data} />
}

// Organization structured data
export function OrganizationStructuredData() {
  const data = {
    name: 'Cat Cafe Directory',
    url: 'https://catcafedirectory.com',
    logo: 'https://catcafedirectory.com/logo.png',
    sameAs: [
      'https://twitter.com/catcafedirectory',
      'https://facebook.com/catcafedirectory'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@catcafedirectory.com'
    }
  }

  return <StructuredData type="organization" data={data} />
}

interface CafeForStructuredData {
  name: string;
  description?: string;
  website_url?: string;
  phone?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  google_rating?: number;
  review_count?: number;
  price_level?: string;
  location_hours?: BusinessHour[];
  photo_url?: string;
}

export function LocalBusinessStructuredData({ cafe }: { cafe: CafeForStructuredData }) {
  const data = {
    name: cafe.name,
    description: cafe.description,
    url: cafe.website_url,
    telephone: cafe.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: cafe.street_address,
      addressLocality: cafe.city,
      addressRegion: cafe.state,
      postalCode: cafe.postal_code,
      addressCountry: cafe.country === 'United States of America' ? 'US' : cafe.country
    },
    geo: cafe.latitude && cafe.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: cafe.latitude,
      longitude: cafe.longitude
    } : undefined,
    aggregateRating: cafe.google_rating ? {
      '@type': 'AggregateRating',
      ratingValue: cafe.google_rating,
      reviewCount: cafe.review_count
    } : undefined,
    priceRange: cafe.price_level,
    openingHoursSpecification: getOpeningHoursSpecification(cafe.location_hours || []),
    image: cafe.photo_url,
    servesCuisine: getServesCuisine(cafe),
    amenityFeature: [
      {
        '@type': 'LocationFeatureSpecification',
        name: 'Cat Companionship',
        value: true
      },
      {
        '@type': 'LocationFeatureSpecification',
        name: 'Cat Adoption',
        value: true
      }
    ]
  }

  return <StructuredData type="localBusiness" data={data} />
}

// Breadcrumb structured data
export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
  const data = {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }

  return <StructuredData type="breadcrumbList" data={data} />
}

// Helper function to format opening hours for structured data
function getOpeningHoursSpecification(hours: BusinessHour[]): Array<{
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string;
  opens: string;
  closes: string;
}> {
  const dayMap = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];
  return hours
    .filter(h => !h.is_closed)
    .map(h => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": dayMap[h.day_of_week - 1],
      "opens": to24Hour(h.open_time) || "",
      "closes": to24Hour(h.close_time) || ""
    }));
}

// Helper to convert "10:00 AM" to "10:00"
function to24Hour(timeStr: string | undefined): string | undefined {
  if (!timeStr) return undefined;
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  if (modifier === 'PM' && hours !== '12') hours = String(Number(hours) + 12);
  if (modifier === 'AM' && hours === '12') hours = '00';
  return `${hours.padStart(2, '0')}:${minutes}`;
}

// Helper to dynamically determine servesCuisine from cafe amenities
function getServesCuisine(cafe: CafeForStructuredData): string[] {
  const amenities = (cafe as any).location_amenities as Array<{ amenity_name?: string }> | undefined;
  if (!amenities || !Array.isArray(amenities)) return ['Coffee', 'Tea', 'Pastries'];
  const amenityNames = amenities.map(a => a.amenity_name?.toLowerCase?.() || '');
  const cuisineKeywords: { [key: string]: string } = {
    coffee: 'Coffee',
    tea: 'Tea',
    pastries: 'Pastries',
    bakery: 'Bakery',
    dessert: 'Dessert',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    vegan: 'Vegan',
    vegetarian: 'Vegetarian',
    halal: 'Halal',
    organic: 'Organic',
    'comfort food': 'Comfort Food',
    'healthy options': 'Healthy',
    'bar food': 'Bar Food',
    snacks: 'Snacks',
    meals: 'Meals',
    food: 'Food'
  };
  const found = Object.entries(cuisineKeywords)
    .filter(([keyword]) => amenityNames.some(a => a.includes(keyword)))
    .map(([, label]) => label);
  return found.length ? Array.from(new Set(found)) : [];
}