'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Shield, FileText, AlertCircle, Check } from 'lucide-react'
import Navbar from '@/components/navbar'

type UserProfile = {
  id: string
  email: string
  fullName: string
  role: string
  createdAt: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [docCount, setDocCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Edit name form
  const [fullName, setFullName] = useState('')
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState('')
  const [nameLoading, setNameLoading] = useState(false)

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/documents?limit=1').then((r) => r.json()),
    ])
      .then(([userData, docData]) => {
        setUser(userData.data)
        setFullName(userData.data?.fullName ?? '')
        setDocCount(docData.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleNameUpdate(e: React.FormEvent) {
    e.preventDefault()
    setNameError('')
    setNameSuccess(false)
    setNameLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, fullName }),
      })

      if (response.ok) {
        setNameSuccess(true)
        setUser((prev) => (prev ? { ...prev, fullName } : prev))
        setTimeout(() => setNameSuccess(false), 3000)
      } else {
        const data = await response.json()
        setNameError(data.error ?? 'Update failed')
      }
    } catch {
      setNameError('Network error')
    } finally {
      setNameLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-32" />
            <div className="bg-white rounded-2xl p-8">
              <div className="h-16 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your account settings
          </p>
        </div>

        {/* User info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.fullName}
              </h2>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-gray-900 mb-1">
                <FileText className="w-5 h-5 text-indigo-600" />
                {docCount.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">Documents</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <span
                  className={`px-3 py-1 text-sm rounded-full font-medium ${
                    user?.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 inline mr-1" />
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Role</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Member since</p>
            </div>
          </div>
        </div>

        {/* Edit name */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">
            Edit Profile
          </h3>
          <form onSubmit={handleNameUpdate} className="space-y-4">
            {nameError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                {nameError}
              </div>
            )}
            {nameSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <Check className="w-4 h-4" />
                Name updated successfully
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full px-4 py-3 border border-gray-100 rounded-xl text-gray-400 bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <button
              type="submit"
              disabled={nameLoading}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {nameLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change password placeholder */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Security</h3>
          <p className="text-sm text-gray-500 mb-5">
            Manage your password and security settings
          </p>
          {passwordError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
              <Check className="w-4 h-4" />
              Password changed successfully
            </div>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setPasswordError('')
              setPasswordSuccess(false)
              setPasswordLoading(true)
              // Password change would require an additional API endpoint
              // For now show a placeholder message
              setTimeout(() => {
                setPasswordError('Password change endpoint not yet configured')
                setPasswordLoading(false)
              }, 500)
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {passwordLoading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
