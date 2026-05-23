import Link from 'next/link'
import { Shield, Lock, FolderOpen, Smartphone, ArrowRight, Check } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-lg">Digital Vault 2.0</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-800 to-purple-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-indigo-200 mb-8">
            <Shield className="w-4 h-4" />
            Secure · Organized · Multi-platform
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            Digital Vault 2.0
          </h1>
          <p className="text-xl sm:text-2xl text-indigo-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            The secure document management system for individuals and teams.
            Store, organize, and share files with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors text-lg shadow-lg shadow-indigo-900/30"
            >
              Start for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-lg border border-white/20"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage documents
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              A complete solution built for security, organization, and
              accessibility across all your devices.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-indigo-100 rounded-xl w-fit mb-6">
                <Lock className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Secure Storage
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Your documents are protected with JWT authentication, bcrypt
                password hashing, and role-based access control. Files stored
                securely in Cloudflare R2.
              </p>
              <ul className="mt-4 space-y-2">
                {['httpOnly cookie auth', 'bcrypt passwords', 'Admin/user roles'].map(
                  (item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-purple-100 rounded-xl w-fit mb-6">
                <FolderOpen className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Easy Organization
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Categorize documents with custom color-coded categories, add
                tags for fast filtering, and keep everything searchable and
                neatly organized.
              </p>
              <ul className="mt-4 space-y-2">
                {['Custom categories', 'Tag-based filtering', 'Full-text search'].map(
                  (item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-green-100 rounded-xl w-fit mb-6">
                <Smartphone className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Multi-Platform
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Access your documents from anywhere. The native mobile app for
                iOS and Android connects seamlessly to the same backend via REST
                API.
              </p>
              <ul className="mt-4 space-y-2">
                {['Next.js web app', 'Expo mobile app', 'Shared REST API'].map(
                  (item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to secure your documents?
          </h2>
          <p className="text-indigo-200 text-lg mb-8">
            Create your free account and start organizing documents in minutes.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors text-lg shadow-lg"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 rounded-lg">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold">Digital Vault 2.0</span>
            </div>
            <p className="text-sm">
              Built with Next.js 14, Expo, Drizzle ORM, and Neon PostgreSQL
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
