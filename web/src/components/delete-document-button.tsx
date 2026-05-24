'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import DeleteModal from './delete-modal'

type Props = {
  documentId: string
  documentTitle: string
}

export default function DeleteDocumentButton({
  documentId,
  documentTitle,
}: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setDeleting(true)
    setError('')
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setShowModal(false)
        router.refresh()
        router.push('/documents')
      } else {
        const data = await response.json().catch(() => ({}))
        setError(
          data.error ?? `Could not delete document (${response.status})`
        )
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>

      <DeleteModal
        isOpen={showModal}
        title={`Delete "${documentTitle}"?`}
        description="This action cannot be undone. The document will be permanently deleted."
        onConfirm={handleConfirm}
        onCancel={() => {
          setShowModal(false)
          setError('')
        }}
        isLoading={deleting}
        error={error}
      />
    </>
  )
}
