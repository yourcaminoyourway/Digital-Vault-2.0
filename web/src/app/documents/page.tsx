'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, FileText, AlertCircle, X } from 'lucide-react'
import Navbar from '@/components/navbar'
import DocumentCard from '@/components/document-card'
import Pagination from '@/components/pagination'
import SearchInput from '@/components/search-input'

type Document = {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  viewCount: number
  createdAt: string
  categoryName: string | null
  categoryColor: string | null
  tags: string[] | null
  userId: string
}

type Category = {
  id: string
  name: string
  color: string
}

export default function DocumentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')

  const page = parseInt(searchParams.get('page') ?? '1')
  const search = searchParams.get('search') ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''
  const sortBy = searchParams.get('sortBy') ?? 'createdAt'
  const sortOrder = searchParams.get('sortOrder') ?? 'desc'

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (search) params.set('search', search)
      if (categoryId) params.set('categoryId', categoryId)
      if (sortBy) params.set('sortBy', sortBy)
      if (sortOrder) params.set('sortOrder', sortOrder)

      const response = await fetch(`/api/documents?${params}`, {
        cache: 'no-store',
      })
      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        setDocuments(data.documents ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 1)
      } else {
        setError(data.error ?? `Could not load documents (${response.status})`)
      }
    } catch {
      setError('Network error — check your connection and try again')
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryId, sortBy, sortOrder])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []))
      .catch(() => {})

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setCurrentUserId(d.data?.id ?? ''))
      .catch(() => {})
  }, [])

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    params.delete('page') // reset to page 1 on filter change
    router.push(`/documents?${params.toString()}`)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/documents?${params.toString()}`)
  }

  function handleDocumentDeleted(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    setTotal((prev) => prev - 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              {total > 0 ? `${total.toLocaleString()} document${total !== 1 ? 's' : ''}` : 'No documents yet'}
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <SearchInput
              initialValue={search}
              onSearch={(v) => updateParams({ search: v })}
              placeholder="Search documents..."
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => updateParams({ categoryId: e.target.value })}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-')
              updateParams({ sortBy: by, sortOrder: order })
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="createdAt-desc">Newest first</option>
            <option value="createdAt-asc">Oldest first</option>
            <option value="title-asc">Title A–Z</option>
            <option value="title-desc">Title Z–A</option>
            <option value="viewCount-desc">Most viewed</option>
          </select>
        </div>

        {/* Error banner */}
        {error && !loading && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-900">{error}</p>
              <button
                onClick={fetchDocuments}
                className="text-xs text-red-700 underline hover:no-underline mt-1"
              >
                Try again
              </button>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Documents grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20">
            <div className="p-4 bg-gray-100 rounded-2xl w-fit mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No documents found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search || categoryId
                ? 'Try adjusting your filters'
                : 'Create your first document to get started'}
            </p>
            {!search && !categoryId && (
              <Link
                href="/documents/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Document
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                currentUserId={currentUserId}
                onDelete={handleDocumentDeleted}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>
    </div>
  )
}
