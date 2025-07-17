'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import slugify from '@/lib/slugify';

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const [popularStates, setPopularStates] = useState<string[]>([])
  const [loadingStates, setLoadingStates] = useState(true)
  const [popularCities, setPopularCities] = useState<{ city: string, state: string, count: number }[]>([])
  const [loadingCities, setLoadingCities] = useState(true)

  useEffect(() => {
    async function fetchPopularStates() {
      setLoadingStates(true)
      const supabase = getSupabaseClient()
      // Use SQL function to get popular states directly
      const { data, error } = await supabase
        .rpc('get_popular_states', { limit_count: 10 })
      if (!error && data) {
        setPopularStates(data.map((row: any) => row.state))
      }
      setLoadingStates(false)
    }

    async function fetchPopularCities() {
      setLoadingCities(true)
      const supabase = getSupabaseClient()
      // Use SQL function to get popular cities directly
      const { data, error } = await supabase
        .rpc('get_popular_cities', { limit_count: 10 })
      if (!error && data) {
        setPopularCities(data.map((row: any) => ({
          city: row.city,
          state: row.state,
          count: row.location_count
        })))
      }
      setLoadingCities(false)
    }

    fetchPopularStates()
    fetchPopularCities()
  }, [])

  const quickLinks = [
    { name: 'Browse States', href: '/states' },
    { name: 'Self Service Car Washes Near Me', href: '/self-service-car-wash-near-me' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Sitemap', href: '/sitemap.xml' },
  ]

  return (
    <footer className="bg-carwash-blue text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img
                src="/self-car-wash-finder.png"
                alt="Self Service Car Wash Finder Logo"
                className="h-12 w-12"
              />
              <div>
                <h4 className="text-lg font-semibold">About Our Directory</h4>
                <p className="text-carwash-light-200 text-xs">Find Local Self Service Car Washes</p>
              </div>
            </div>
            <p className="text-carwash-light-200 text-sm leading-relaxed">
              Your comprehensive directory for finding the best self-service car washes across
              the United States. Discover local self-service car washes where you can wash
              your car with professional equipment on your own schedule.
            </p>
          </div>

          {/* Quick Links */}
          <div className="lg:border-l border-gray-800 pl-0 lg:pl-8">
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <nav aria-label="Quick links">
              <ul className="space-y-1">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-carwash-light-200 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Popular States */}
          <div className="lg:border-l border-gray-800 pl-0 lg:pl-8">
            <h4 className="text-lg font-semibold mb-4">Popular States</h4>
            <nav aria-label="Popular states">
              <ul className="space-y-1">
                {loadingStates ? (
                  <li className="text-carwash-light-200 text-sm">Loading...</li>
                ) : (
                  popularStates.map((state) => (
                    <li key={state}>
                      <Link
                        href={`/states/${state.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-carwash-light-200 hover:text-white transition-colors text-sm"
                      >
                        {state} Self Service Car Washes
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </nav>
          </div>

          {/* Popular Cities */}
          <div className="lg:border-l border-gray-800 pl-0 lg:pl-8">
            <h4 className="text-lg font-semibold mb-4">Popular Cities</h4>
            <nav aria-label="Popular cities">
              <ul className="space-y-1">
                {loadingCities ? (
                  <li className="text-carwash-light-200 text-sm">Loading...</li>
                ) : (
                  popularCities.map(({ city, state }) => (
                    <li key={`${city},${state}`}>
                      <Link
                        href={`/cities/${slugify(city)}-${slugify(state)}`}
                        className="text-carwash-light-200 hover:text-white transition-colors text-sm"
                      >
                        {city}, {state} Self Service Car Washes
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </nav>
          </div>
        </div>

        <div className="border-t border-carwash-light-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-carwash-light-200 text-sm">
              © {currentYear} Self Service Car Wash Finder. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 text-sm text-carwash-light-200">
              <span>
                Helping car owners find the best local self-service car washes since 2025
              </span>
              <span>•</span>
              <a
                href="https://www.google.com/search?q=self+service+car+wash+finder"
                className="hover:text-white transition-colors flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                Search on Google
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 