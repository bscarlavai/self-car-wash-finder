import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { generateSocialPreview } from '@/components/SocialPreview'

export const metadata: Metadata = generateSocialPreview({
  title: 'Terms of Service - Cat Cafe Directory',
  description: 'Terms of service and usage guidelines for Cat Cafe Directory.',
})

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Navigation */}
        <nav className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-lavender-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </nav>

        {/* Terms of Service Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-8">
              <strong>Effective Date:</strong> January 1, 2025
            </p>

            <p className="text-gray-700 mb-6">
              Welcome to Cat Cafe Directory ("we," "our," or "us"). By using our website, you agree to be bound by the following Terms of Service. If you do not agree to these terms, please do not use our site.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Use of Our Website</h2>
            <p className="text-gray-700 mb-6">
              Our site is intended to help users find and explore cat cafés across the United States. By using the site, you agree to use it only for lawful purposes and not for any activity that may harm the site or other users.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Accuracy of Information</h2>
            <p className="text-gray-700 mb-6">
              We strive to provide accurate and up-to-date listings, but we cannot guarantee the completeness or accuracy of all information. Business details such as hours, services, and addresses may change.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. External Links</h2>
            <p className="text-gray-700 mb-6">
              Our site may contain links to third-party websites. We are not responsible for the content or practices of those sites. Visiting external sites is at your own risk.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Intellectual Property</h2>
            <p className="text-gray-700 mb-6">
              All content on this site—including text, layout, and design—is owned by Cat Cafe Directory unless otherwise noted. You may not copy, reproduce, or republish any part of the site without written permission.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Limitation of Liability</h2>
            <p className="text-gray-700 mb-6">
              We are not liable for any damages arising from the use or inability to use our website, including inaccuracies in listings or issues with third-party businesses.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Changes to These Terms</h2>
            <p className="text-gray-700 mb-6">
              We reserve the right to update these Terms at any time. Continued use of the site after changes means you accept the updated Terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Contact Information</h2>
            <p className="text-gray-700 mb-6">
              If you have any questions about these Terms of Service, please contact us at hello@catcafedirectory.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 