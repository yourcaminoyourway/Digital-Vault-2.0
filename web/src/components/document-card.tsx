'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Eye, Calendar, Edit, Trash2, Globe, Lock, Paperclip } from 'lucide-react'
import clsx from 'clsx'
import CategoryBadge from './category-badge'
import DeleteModal from './delete-modal'
import { formatFileSize } from '@/lib/format'

type DocumentCardProps = {
  document: {
    id: string
    title: string
    description?: string | null
    isPublic: boolean
    viewCount: number
    createdAt: Date | string
    categoryName?: string | null
    categoryColor?: string | null
    tags?: string[] | null
    userId: string
    fileUrl?: string | null
    fileName?: string | null
    fileSize?: number | null
  }
  currentUserId?: string
  onDelete?: (id: string) => void
}

export default function DocumentCard({
  document,
  currentUserId,
  onDelete,
}: DocumentCardProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string>('')

  const isOwner = currentUserId === document.userId

  const formattedDate = new Date(document.createdAt).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' }
  )

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setShowDeleteModal(false)
        onDelete?.(document.id)
        router.refresh()
      } else {
        const data = await response.json().catch(() => ({}))
        setDeleteError(
          data.error ?? `Could not delete document (${response.status})`
        )
      }
    } catch {
      setDeleteError('Network error — please try again')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200 group">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/documents/${document.id}`}
            className="flex items-start gap-3 flex-1 min-w-0"
          >
            <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0 mt-0.5">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                {document.title}
              </h3>
              {document.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {document.description}
                </p>
              )}
            </div>
          </Link>

          {isOwner && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Link
                href={`/documents/${document.id}/edit`}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {document.categoryName && (
            <CategoryBadge
              name={document.categoryName}
              color={document.categoryColor ?? '#6366f1'}
            />
          )}

          <span
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              document.isPublic
                ? 'bg-green-50 text-green-700'
                : 'bg-gray-100 text-gray-600'
            )}
          >
            {document.isPublic ? (
              <>
                <Globe className="w-3 h-3" /> Public
              </>
            ) : (
              <>
                <Lock className="w-3 h-3" /> Private
              </>
            )}
          </span>

          {document.fileUrl && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700"
              title={
                document.fileName
                  ? `${document.fileName}${
                      document.fileSize
                        ? ` · ${formatFileSize(document.fileSize)}`
                        : ''
                    }`
                  : 'Has attached file'
              }
            >
              <Paperclip className="w-3 h-3" /> File
            </span>
          )}

          {document.tags
            ?.slice(0, 3)
            .map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {document.viewCount} views
          </span>
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        title={`Delete "${document.title}"?`}
        description="This action cannot be undone. The document will be permanently deleted."
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false)
          setDeleteError('')
        }}
        isLoading={deleting}
        error={deleteError}
      />
    </>
  )
}
