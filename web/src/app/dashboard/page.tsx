import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, FolderOpen, Share2, Eye, Plus, ArrowRight } from 'lucide-react'
import Navbar from '@/components/navbar'
import StatsCard from '@/components/stats-card'
import CategoryBadge from '@/components/category-badge'
import { getSession } from '@/lib/auth'
import { getUserById } from '@/services/userService'
import { getDocumentStats, getRecentDocuments } from '@/services/documentService'
import { db } from '@/lib/db'
import { categories, documentShares } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [user, stats, recentDocs, categoryCount, shareCount] = await Promise.all([
    getUserById(session.userId),
    getDocumentStats(session.userId),
    getRecentDocuments(session.userId, 5),
    db
      .select({ count: count() })
      .from(categories)
      .where(eq(categories.userId, session.userId))
      .then((r) => r[0]?.count ?? 0),
    db
      .select({ count: count() })
      .from(documentShares)
      .then((r) => r[0]?.count ?? 0),
  ])

  const firstName = user?.fullName?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Good morning, {firstName}! 👋
            </h1>
            <p className="text-gray-500 mt-1">
              Here&apos;s an overview of your vault
            </p>
          </div>
          <Link
            href="/documents/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Document
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatsCard
            icon={FileText}
            title="Total Documents"
            value={stats.totalDocuments}
            color="indigo"
          />
          <StatsCard
            icon={FolderOpen}
            title="Categories"
            value={categoryCount}
            color="amber"
          />
          <StatsCard
            icon={Share2}
            title="Shared Docs"
            value={shareCount}
            color="green"
          />
          <StatsCard
            icon={Eye}
            title="Total Views"
            value={stats.totalViews}
            color="rose"
          />
        </div>

        {/* Recent documents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Documents
            </h2>
            <Link
              href="/documents"
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentDocs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="p-4 bg-gray-100 rounded-2xl w-fit mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No documents yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Create your first document to get started
              </p>
              <Link
                href="/documents/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Document
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                    {doc.description && (
                      <p className="text-sm text-gray-400 truncate mt-0.5">
                        {doc.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {doc.categoryName && (
                      <CategoryBadge
                        name={doc.categoryName}
                        color={doc.categoryColor ?? '#6366f1'}
                      />
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
