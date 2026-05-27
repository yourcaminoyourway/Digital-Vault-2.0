'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, Upload, Trash2, FileText, Check } from 'lucide-react'
import Navbar from '@/components/navbar'
import { formatFileSize } from '@/lib/format'

type Document = {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  isPublic: boolean
  tags: string[] | null
  fileName?: string | null
  fileSize?: number | null
  fileUrl?: string | null
}

type Category = {
  id: string
  name: string
  color: string
}

export default function EditDocumentPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState<
    null | 'notfound' | 'forbidden' | 'network'
  >(null)

  // File management state (separate from metadata save)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [fileMsg, setFileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [fileBusy, setFileBusy] = useState(false)
  const MAX_FILE_BYTES = 3 * 1024 * 1024

  useEffect(() => {
    async function load() {
      try {
        const [docRes, catRes] = await Promise.all([
          fetch(`/api/documents/${params.id}`),
          fetch('/api/categories'),
        ])

        if (docRes.status === 404) {
          setLoadError('notfound')
          return
        }
        if (docRes.status === 403 || docRes.status === 401) {
          setLoadError('forbidden')
          return
        }
        if (!docRes.ok) {
          setLoadError('network')
          return
        }

        const docData = await docRes.json()
        const catData = catRes.ok ? await catRes.json() : { data: [] }

        const doc = docData.data
        if (!doc) {
          setLoadError('notfound')
          return
        }
        setDocument(doc)
        setTitle(doc.title ?? '')
        setDescription(doc.description ?? '')
        setCategoryId(doc.categoryId ?? '')
        setIsPublic(doc.isPublic ?? false)
        setTags(doc.tags?.join(', ') ?? '')
        setCategories(catData.data ?? [])
      } catch {
        setLoadError('network')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const response = await fetch(`/api/documents/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          categoryId: categoryId || null,
          isPublic,
          tags: tagList,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to update document')
      }

      // Invalidate router cache so the list + detail show fresh data
      router.refresh()
      router.push(`/documents/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFileUpload() {
    if (!newFile) return
    setFileMsg(null)

    if (newFile.size > MAX_FILE_BYTES) {
      setFileMsg({
        type: 'error',
        text: `File is too large (${formatFileSize(newFile.size)}). Max 3 MB.`,
      })
      return
    }

    setFileBusy(true)
    try {
      const formData = new FormData()
      formData.append('file', newFile)
      const res = await fetch(`/api/documents/${params.id}/file`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFileMsg({
          type: 'error',
          text: data.error ?? 'Upload failed. Please try again.',
        })
      } else {
        setDocument((prev) =>
          prev
            ? {
                ...prev,
                fileName: data.data?.fileName ?? newFile.name,
                fileSize: data.data?.fileSize ?? newFile.size,
                fileUrl: data.data?.fileUrl ?? `/api/documents/${params.id}/file`,
              }
            : prev
        )
        setNewFile(null)
        setFileMsg({ type: 'success', text: 'File uploaded successfully.' })
        router.refresh()
      }
    } catch {
      setFileMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setFileBusy(false)
    }
  }

  async function handleFileRemove() {
    if (!confirm('Remove the attached file? This cannot be undone.')) return
    setFileMsg(null)
    setFileBusy(true)
    try {
      const res = await fetch(`/api/documents/${params.id}/file`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFileMsg({
          type: 'error',
          text: data.error ?? 'Could not remove file.',
        })
      } else {
        setDocument((prev) =>
          prev
            ? { ...prev, fileName: null, fileSize: null, fileUrl: null }
            : prev
        )
        setFileMsg({ type: 'success', text: 'File removed.' })
        // Invalidate the detail page cache so the Download button disappears
        router.refresh()
      }
    } catch {
      setFileMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setFileBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="bg-white rounded-2xl p-8 space-y-4">
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-24 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (loadError || !document) {
    const messages = {
      notfound: {
        title: 'Document not found',
        body: "This document doesn't exist or has been deleted.",
      },
      forbidden: {
        title: 'Access denied',
        body: "You don't have permission to edit this document.",
      },
      network: {
        title: 'Could not load document',
        body: 'Check your connection and try again.',
      },
    }
    const msg = messages[loadError ?? 'notfound']

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 inline-block">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {msg.title}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{msg.body}</p>
            <div className="flex gap-2 justify-center">
              {loadError === 'network' && (
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Retry
                </button>
              )}
              <Link
                href="/documents"
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                Back to Documents
              </Link>
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
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/documents/${params.id}`}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Document</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Update document details
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Visibility
                </label>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPublic ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPublic ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">
                    {isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="important, draft, review"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                Separate tags with commas
              </p>
            </div>

            {/* File attachment section (managed separately from metadata save) */}
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attached File
              </label>

              {fileMsg && (
                <div
                  className={`mb-3 flex items-center gap-2 p-3 rounded-lg text-sm ${
                    fileMsg.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {fileMsg.type === 'success' ? (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{fileMsg.text}</span>
                </div>
              )}

              {document?.fileName ? (
                <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-900 truncate">
                      {document.fileName}
                    </p>
                    {document.fileSize != null && (
                      <p className="text-xs text-indigo-600">
                        {formatFileSize(document.fileSize)}
                      </p>
                    )}
                  </div>
                  <a
                    href={`/api/documents/${params.id}/file`}
                    className="text-xs px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={handleFileRemove}
                    disabled={fileBusy}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : newFile ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <Upload className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-indigo-900 truncate">
                        {newFile.name}
                      </p>
                      <p className="text-xs text-indigo-600">
                        {formatFileSize(newFile.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewFile(null)}
                      disabled={fileBusy}
                      className="text-indigo-400 hover:text-indigo-600"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={fileBusy}
                    className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {fileBusy ? 'Uploading…' : 'Upload File'}
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                  <Upload className="w-7 h-7 text-gray-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                      Attach a file
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Max 3 MB · stored in your account
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      setFileMsg(null)
                      setNewFile(e.target.files?.[0] ?? null)
                    }}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href={`/documents/${params.id}`}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
