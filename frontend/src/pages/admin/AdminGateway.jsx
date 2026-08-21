import { Link } from 'react-router-dom'
import { Shield, Home } from 'lucide-react'
import SEO from '../../components/SEO'

export default function AdminGateway() {
  return (
    <>
      <SEO title="Admin Access" noindex />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white -mt-16">
        <div className="text-center max-w-lg">
          <div className="flex justify-center mb-6">
            <Shield size={80} className="text-[#448834]" strokeWidth={1.5} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            We know what you are trying to do :D
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Your IP address has been logged as a precaution.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-[#448834] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3a7329] transition-colors"
            >
              <Home size={18} />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
