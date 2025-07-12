"use client"

import React from 'react'
import { Check, Wifi, Coffee, CreditCard, Baby, Calendar, Star, Heart, Users, Toilet, SquareParking, Hamburger, CalendarCheck } from 'lucide-react'

const POPULAR_AMENITIES = [
  { label: 'Bathroom', key: 'Bathroom', icon: <Toilet className="h-5 w-5" /> },
  { label: 'Credit Cards', key: 'Credit Cards', icon: <CreditCard className="h-5 w-5" /> },
  { label: 'Drinks', key: 'Drinks', icon: <Coffee className="h-5 w-5" /> },
  { label: 'Food', key: 'Food', icon: <Hamburger className="h-5 w-5" /> },
  { label: 'Kid-friendly', key: 'Kid-friendly', icon: <Baby className="h-5 w-5" /> },
  { label: 'Appointment Required', key: 'Appointment Required', icon: <CalendarCheck className="h-5 w-5" /> },
  { label: 'Parking', key: 'Parking', icon: <SquareParking className="h-5 w-5" /> },
  { label: 'Reservations', key: 'Reservations', icon: <Calendar className="h-5 w-5" /> },
  { label: 'WiFi', key: 'WiFi', icon: <Wifi className="h-5 w-5" /> },
]

interface Props {
  amenitiesByCategory: { [key: string]: string[] }
  sortedCategories: string[]
}

const amenityMatchMap: { [key: string]: string[] } = {
  "Kid-friendly": [
    "kid-friendly", "kid-friendly activities", "kid-friendly hikes", "good for kids", "good for kids birthday",
    "high chairs", "has changing table(s)", "discounts for kids", "family-friendly", "family discount", "kids' menu"
  ],
  "Bathroom": [
    "bathroom", "restroom", "public restroom", "gender-neutral restroom", "nursing room"
  ],
  "WiFi": [
    "wi-fi", "free wi-fi", "wireless internet"
  ],
  "Drinks": [
    "drinks", "coffee", "tea", "great tea selection", "cocktails", "great cocktails", "beer", "great beer selection",
    "wine", "great wine list", "bar onsite", "bar games", "barbecue grill", "alcohol", "hard liquor", "happy hour drinks"
  ],
  "Food": [
    "food", "meals", "lunch", "breakfast", "dinner", "brunch", "dessert", "great dessert", "great bar food", "great coffee",
    "great produce", "great tea selection", "great wine list", "all you can eat", "comfort food", "healthy options",
    "halal food", "vegan options", "vegetarian options", "organic dishes", "organic products", "small plates", "salad bar",
    "prepared foods", "bakery", "cafe", "restaurant", "quick bite", "quick visit", "outside food allowed", "food at bar",
    "free breakfast", "late-night food", "brunch reservations recommended", "dinner reservations recommended",
    "lunch reservations recommended"
  ],
  "Parking": [
    "parking", "free parking", "free parking garage", "free parking lot", "free street parking", "paid parking garage",
    "paid parking lot", "paid street parking", "on-site parking", "valet parking", "car vacuum", "hand car wash", "undercarriage cleaning"
  ],
  "Credit Cards": [
    "credit cards", "accepts credit cards", "debit cards", "checks", "check cashing", "cash-only", "nfc mobile payments", "snap/ebt", "card payment"
  ],
  "Reservations": [
    "accepts reservations", "reservations required", "appointments recommended", "appointment required", "appointments only",
    "brunch reservations recommended", "dinner reservations recommended", "lunch reservations recommended", "accepts walk-ins"
  ],
  "Appointment Required": [
    "appointment required", "appointments recommended", "appointments only", "reservations required"
  ],
  "Accessible": [
    "accessible", "braille menu"
  ],
  "Atmosphere": [
    "cozy", "casual", "lively", "quiet", "romantic", "trendy", "upscale", "historic", "fireplace", "rooftop seating", "pool", "swimming pool",
    "volleyball court", "basketball court", "playground", "slides", "picnic tables", "table service", "private dining room", "seating", "stadium seating"
  ],
  "Service": [
    "fast service", "counter service", "dine-in", "takeout", "delivery", "curbside pickup", "drive-through", "no-contact delivery", "in-store pickup",
    "in-store shopping", "same-day delivery", "service guarantee"
  ],
  "Events/Entertainment": [
    "live music", "live performances", "karaoke", "trivia night", "dancing", "bar games", "arcade games", "sports", "theater", "3d movies", "party services", "petting zoo", "offers tours"
  ],
  "Identity/Ownership": [
    "identifies as asian-owned", "identifies as black-owned", "identifies as disabled-owned", "identifies as indigenous-owned", "identifies as latino-owned",
    "identifies as lgbtq+ owned", "identifies as veteran-owned", "identifies as women-owned", "lgbtq+ friendly", "transgender safespace"
  ],
  "Other": [
    "admission fee", "active military discounts", "buys used goods", "gift shop", "flowers", "pharmacy", "trending", "tourists", "locals", "usually a wait",
    "getting tickets in advance recommended", "service guarantee", "snap/ebt", "organic products", "onsite services", "prepared foods", "restaurant", "quick visit"
  ]
}

// Helper function to get appropriate icon for each category
function getCategoryIcon(category: string) {
  const iconMap: { [key: string]: React.ReactNode } = {
    'Service options': <Coffee className="h-5 w-5 text-lavender-600" />,
    'Highlights': <Star className="h-5 w-5 text-lavender-600" />,
    'Offerings': <Coffee className="h-5 w-5 text-lavender-600" />,
    'Dining options': <Hamburger className="h-5 w-5 text-lavender-600" />,
    'Amenities': <Wifi className="h-5 w-5 text-lavender-600" />,
    'Atmosphere': <Heart className="h-5 w-5 text-lavender-600" />,
    'Crowd': <Users className="h-5 w-5 text-lavender-600" />,
    'Planning': <Calendar className="h-5 w-5 text-lavender-600" />,
    'Payments': <CreditCard className="h-5 w-5 text-lavender-600" />,
    'Children': <Baby className="h-5 w-5 text-lavender-600" />,
    'Parking': <SquareParking className="h-5 w-5 text-lavender-600" />,
    'Other': <Star className="h-5 w-5 text-lavender-600" />,
  };
  return iconMap[category] || <Star className="h-5 w-5 text-lavender-600" />;
}

export default function AmenitiesSummaryAndDetails({ amenitiesByCategory, sortedCategories }: Props) {
  const [expanded, setExpanded] = React.useState(false)
  // Flatten all amenities for quick lookup
  const allAmenities = React.useMemo(() => Object.values(amenitiesByCategory).flat().map(a => a.toLowerCase()), [amenitiesByCategory])

  function hasAmenity(popularKey: string) {
    const matches = amenityMatchMap[popularKey]
    return allAmenities.some(a => matches.some(m => a.includes(m)))
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <div className="w-8 h-8 bg-lavender-100 rounded-lg flex items-center justify-center mr-3">
          <span className="text-lavender-600 font-bold text-lg">★</span>
        </div>
        Amenities & Features
      </h2>
      {/* Summary List */}
      <ul className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-lavender-50 rounded p-2">
        {[...POPULAR_AMENITIES].sort((a, b) => a.label.localeCompare(b.label)).map(({ label, key, icon }) => {
          const available = hasAmenity(key)
          return (
            <li
              key={key}
              className="flex items-center px-2 py-2 rounded"
            >
              <span className={available ? "text-lavender-600" : "text-gray-400"}>{icon}</span>
              <span className={available ? "ml-2 font-medium text-lavender-700" : "ml-2 text-gray-500"}>{label}</span>
              {available && <Check className="ml-2 h-4 w-4 text-green-500" />}
            </li>
          )
        })}
      </ul>
      <button
        className="text-lavender-600 font-semibold underline mb-4"
        onClick={() => setExpanded(e => !e)}
        type="button"
      >
        {expanded ? 'Hide all amenities' : 'Show all amenities'}
      </button>
      {expanded && (
        <div className="space-y-8 mt-6">
          {sortedCategories.map((category) => (
            <div key={category} className="border border-gray-100 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-lavender-100 rounded-lg flex items-center justify-center mr-3">
                  {getCategoryIcon(category)}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{category}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {amenitiesByCategory[category].map((amenity: string) => (
                  <div key={amenity} className="flex items-center p-2 bg-gray-100 rounded-md border border-gray-200 hover:border-lavender-300 hover:bg-lavender-100 transition-all duration-200">
                    <span className="text-gray-800 text-sm font-medium">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 