import { redirect } from 'next/navigation'
import { Shield, Users, FileText, UserCheck } from 'lucide-react'
import Navbar from '@/components/navbar'
import StatsCard from '@/components/stats-card'
import AdminUserRow from '@/components/admin-user-row'
import { getSession } from '@/lib/auth'
import { getAllUsers } from '@/services/userService'
import { db } from '@/lib/db'
import { documents, users } from '@/lib/db/schema'
import { count, eq } from 'drizzle-orm'

export const metadata = { title: 'Admin Panel' }

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect('/dashboard')

  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const search = searchParams.search

  const [{ users: userList, total, totalPages }, totalDocCount, activeUserCount] =
    await Promise.all([
      getAllUsers(page, 20, search),
      db.select({ count: count() }).from(documents).then((r) => r[0]?.count ?? 0),
      db
        .select({ count: count() })
        .from(users)
        .where(eq(users.isActive, true))
        .then((r) => r[0]?.count ?? 0),
    ])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage users and platform settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatsCard icon={Users} title="Total Users" value={total} color="indigo" />
          <StatsCard icon={FileText} title="Total Documents" value={totalDocCount} color="green" />
          <StatsCard icon={UserCheck} title="Active Users" value={activeUserCount} color="amber" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Users</h2>
              <span className="text-sm text-gray-500">{total.toLocaleString()} total</span>
            </div>
            <form method="GET" action="/admin" className="flex gap-2">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by name or email..."
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Search
              </button>
              {search && (
                <a
                  href="/admin"
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </a>
              )}
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">User</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Documents</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Joined</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {userList.map((user) => (
                  <AdminUserRow key={user.id} user={user} currentUserId={session.userId} />
                ))}
              </tbody>
            </table>
          </div>

          {userList.length === 0 && (
            <div className="p-12 text-center text-gray-500">No users found.</div>
          )}

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`/admin?page=${page - 1}${search ? `&search=${search}` : ''}`}
                    className="px-3 py-1.5 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`/admin?page=${page + 1}${search ? `&search=${search}` : ''}`}
                    className="px-3 py-1.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
