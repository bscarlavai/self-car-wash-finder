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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState({ feedback: '', email: '' })
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  // Use provided states or fallback to empty array
  const statesList = states.length > 0 ? states.sort((a, b) => a.name.localeCompare(b.name)) : []

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmittingFeedback(true)
    setFeedbackMessage('')
    try {
      const supabase = (await import('@/lib/supabase')).getSupabaseClient()
      const { error } = await supabase
        .from('location_feedbacks')
        .insert({
          location_id: null,
          feedback: feedbackForm.feedback,
          email: feedbackForm.email || null
        })
      if (error) {
        setFeedbackMessage('Error submitting feedback. Please try again.')
      } else {
        setFeedbackMessage('Thank you for your feedback!')
        setFeedbackForm({ feedback: '', email: '' })
        setTimeout(() => setShowFeedbackModal(false), 1500)
      }
    } catch {
      setFeedbackMessage('Error submitting feedback. Please try again.')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

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
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="ml-4 px-4 py-2 rounded-lg bg-carwash-blue text-white font-semibold shadow hover:bg-tarawera transition"
              type="button"
            >
              Leave Feedback
            </button>
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
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="mt-2 px-4 py-2 rounded-lg bg-carwash-blue text-white font-semibold shadow hover:bg-tarawera transition"
                type="button"
              >
                Leave Feedback
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto">
            <div className="sticky top-0 z-10 bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900">Leave Feedback</h2>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="px-6 py-6 max-h-[70vh] overflow-y-auto space-y-6">
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Feedback *
                </label>
                <textarea
                  id="feedback"
                  required
                  value={feedbackForm.feedback}
                  onChange={e => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carwash-blue focus:border-transparent min-h-[100px]"
                  placeholder="Let us know if something is wrong, missing, or could be improved."
                />
              </div>
              <div>
                <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  id="feedback-email"
                  value={feedbackForm.email}
                  onChange={e => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carwash-blue focus:border-transparent"
                  placeholder="If you'd like a reply, enter your email"
                />
              </div>
              {feedbackMessage && (
                <div className="p-3 rounded-lg text-sm text-center "
                  style={{ color: feedbackMessage.includes('Thank you') ? '#15803d' : '#dc2626', background: feedbackMessage.includes('Thank you') ? '#f0fdf4' : '#fef2f2' }}>
                  {feedbackMessage}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="bg-carwash-blue text-white px-4 py-2.5 rounded-lg font-medium hover:bg-carwash-blue/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-carwash-blue focus:ring-offset-2"
                >
                  {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  )
} 