'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import {
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentById,
} from '@/services/documentService'

export async function createDocumentAction(formData: FormData) {
  const session = await getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string | undefined
  const categoryId = formData.get('categoryId') as string | undefined
  const isPublic = formData.get('isPublic') === 'true'
  const tagsRaw = formData.get('tags') as string | undefined
  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : []

  if (!title) {
    throw new Error('Title is required')
  }

  const document = await createDocument(session.userId, {
    title,
    description: description || undefined,
    categoryId: categoryId || undefined,
    isPublic,
    tags,
  })

  revalidatePath('/documents')
  redirect(`/documents/${document.id}`)
}

export async function updateDocumentAction(id: string, formData: FormData) {
  const session = await getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const title = formData.get('title') as string | undefined
  const description = formData.get('description') as string | undefined
  const categoryId = formData.get('categoryId') as string | undefined
  const isPublic = formData.get('isPublic') === 'true'
  const tagsRaw = formData.get('tags') as string | undefined
  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : undefined

  const document = await updateDocument(id, session.userId, {
    title: title || undefined,
    description,
    categoryId: categoryId || null,
    isPublic,
    tags,
  })

  if (!document) {
    throw new Error('Document not found or unauthorized')
  }

  revalidatePath(`/documents/${id}`)
  revalidatePath('/documents')
  redirect(`/documents/${id}`)
}

export async function deleteDocumentAction(id: string) {
  const session = await getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const isAdmin = session.role === 'admin'
  const deleted = await deleteDocument(id, session.userId, isAdmin)

  if (!deleted) {
    throw new Error('Document not found or unauthorized')
  }

  revalidatePath('/documents')
  redirect('/documents')
}

export async function toggleDocumentPublicAction(id: string) {
  const session = await getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const doc = await getDocumentById(id, session.userId)
  if (!doc) {
    throw new Error('Document not found')
  }

  if (doc.userId !== session.userId) {
    throw new Error('Unauthorized')
  }

  const updated = await updateDocument(id, session.userId, {
    isPublic: !doc.isPublic,
  })

  revalidatePath(`/documents/${id}`)
  revalidatePath('/documents')

  return updated
}
