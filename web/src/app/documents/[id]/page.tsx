import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Edit,
  Globe,
  Lock,
  Eye,
  Calendar,
  Download,
  Tag,
} from 'lucide-react'
import Navbar from '@/components/navbar'
import CategoryBadge from '@/components/category-badge'
import DeleteDocumentButton from '@/components/delete-document-button'
import { getSession } from '@/lib/auth'
import { getDocumentById, incrementViewCount } from '@/services/documentService'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}) {
  const session = await getSession()
  if (!session) return { title: 'Document' }
  const doc = await getDocumentById(params.id, session.userId)
  return { title: doc?.title ?? 'Document' }
}

export default async function DocumentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const document = await getDocumentById(params.id, session.userId)
  if (!document) notFound()

  // Increment view count in background
  incrementViewCount(params.id).catch(console.error)

  const isOwner = document.userId === session.userId

  const formattedDate = new Date(document.createdAt).toLocaleDateString(
    'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back nav */}
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 rounded-xl flex-shrink-0">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {document.title}
                  </h1>
                  {document.description && (
                    <p className="text-gray-500 mt-2 leading-relaxed">
                      {document.description}
                    </p>
                  )}
                </div>
              </div>

              {isOwner && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/documents/${document.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <DeleteDocumentButton
                    documentId={document.id}
                    documentTitle={document.title}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Visibility
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    document.isPublic
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {document.isPublic ? (
                    <>
                      <Globe className="w-3.5 h-3.5" /> Public
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Private
                    </>
                  )}
                </span>
              </div>

              {document.categoryName && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Category
                  </p>
                  <CategoryBadge
                    name={document.categoryName}
                    color={document.categoryColor ?? '#6366f1'}
                  />
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Created
                </p>
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formattedDate}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Views
                </p>
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <Eye className="w-4 h-4 text-gray-400" />
                  {document.viewCount.toLocaleString()} views
                </div>
              </div>
            </div>

            {document.tags && document.tags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {document.fileUrl && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Attached File
                </p>
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 max-w-full"
                >
                  <Download className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Download File</span>
                  {document.fileSize && (
                    <span className="text-indigo-400 flex-shrink-0">
                      ({(document.fileSize / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  )}
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
