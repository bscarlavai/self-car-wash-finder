'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, MapPin } from 'lucide-react'
import Search from './Search'

interface State {
  name: string
  slug: string
  locationCount: number
}

interface HeaderProps {
  states?: State[]
}

export default function Header({ states = [] }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Use provided states or fallback to empty array
  const statesList = states.length > 0 ? states.sort((a, b) => a.name.localeCompare(b.name)) : []

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img src="/self-car-wash-finder.png" alt="Self Service Car Wash Finder Logo" className="h-16 w-16" />
            <div>
              <h2 className="text-xl font-bold text-carwash-blue">Self Service Car Wash Finder</h2>
              <p className="text-xs text-carwash-light-700">Find Local Self Service Car Washes</p>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <Search />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-carwash-blue hover:text-carwash-light-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link href="/self-service-car-wash-near-me" className="text-carwash-blue hover:text-carwash-light-600 font-medium transition-colors">
              Self Service Car Washes Near Me
            </Link>
            <Link 
              href="/states" 
              className="text-carwash-blue hover:text-carwash-light-600 font-medium transition-colors"
            >
              Browse States
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-carwash-blue hover:text-carwash-light-600 hover:bg-carwash-light-50"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mb-4">
          <Search />
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-lavender-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/self-service-car-wash-near-me" 
                className="text-gray-700 hover:text-lavender-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Self Service Car Washes Near Me
              </Link>
              <Link 
                href="/states" 
                className="text-gray-700 hover:text-lavender-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse States
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 