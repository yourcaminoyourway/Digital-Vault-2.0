'use client'

import { useState } from 'react'

type UserRow = {
  id: string
  fullName: string
  email: string
  role: 'admin' | 'user'
  isActive: boolean
  documentCount: number
  createdAt: Date
}

export default function AdminUserRow({
  user,
  currentUserId,
}: {
  user: UserRow
  currentUserId: string
}) {
  const [role, setRole] = useState(user.role)
  const [loading, setLoading] = useState(false)
  const isSelf = user.id === currentUserId

  async function toggleRole() {
    if (isSelf) return
    setLoading(true)
    const newRole = role === 'admin' ? 'user' : 'admin'
    try {
      const res = await fetch(`/api/users`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role: newRole }),
      })
      if (res.ok) setRole(newRole)
    } finally {
      setLoading(false)
    }
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-gray-900">{user.fullName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
          }`}
        >
          {role}
        </span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {user.documentCount.toLocaleString()}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </td>
      <td className="px-6 py-4">
        {isSelf ? (
          <span className="text-xs text-gray-400">You</span>
        ) : (
          <button
            onClick={toggleRole}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors disabled:opacity-50
              border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            {loading ? '...' : role === 'admin' ? 'Remove admin' : 'Make admin'}
          </button>
        )}
      </td>
    </tr>
  )
}
