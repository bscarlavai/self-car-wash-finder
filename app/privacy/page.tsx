import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { generateSocialPreview } from '@/components/SocialPreview'

export const metadata: Metadata = generateSocialPreview({
  title: 'Privacy Policy - Cat Cafe Directory',
  description: 'Learn how Cat Cafe Directory protects your privacy and handles your data.',
})

export default function PrivacyPage() {
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

        {/* Privacy Policy Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-8">
              <strong>Effective Date:</strong> January 1, 2025
            </p>

            <p className="text-gray-700 mb-6">
              Welcome to Cat Cafe Directory ("we," "our," or "us"). By using our website, you agree to be bound by this Privacy Policy. If you do not agree to this policy, please do not use our site.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-6">
              We collect information you provide directly to us, such as when you search for cat cafes or contact us. We also automatically collect certain information about your device and how you interact with our website, including your IP address, browser type, and pages visited.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-6">
              We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to develop new features. We do not sell your personal information to third parties.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Information Sharing</h2>
            <p className="text-gray-700 mb-6">
              We may share your information with service providers who help us operate our website, as required by law, or with your consent. We do not share your personal information with third parties for their marketing purposes.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p className="text-gray-700 mb-6">
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-6">
              We use cookies and similar technologies to enhance your experience on our website. You can control cookie settings through your browser preferences.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Third-Party Services</h2>
            <p className="text-gray-700 mb-6">
              Our site may contain links to third-party websites and services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Children's Privacy</h2>
            <p className="text-gray-700 mb-6">
              Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Changes to This Policy</h2>
            <p className="text-gray-700 mb-6">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Contact Us</h2>
            <p className="text-gray-700 mb-6">
              If you have any questions about this Privacy Policy, please contact us at hello@catcafedirectory.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 