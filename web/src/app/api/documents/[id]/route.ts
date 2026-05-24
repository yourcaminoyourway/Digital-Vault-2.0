import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import {
  getDocumentById,
  updateDocument,
  deleteDocument,
  incrementViewCount,
} from '@/services/documentService'
import { deleteFile } from '@/lib/r2'

export const dynamic = 'force-dynamic'

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const document = await getDocumentById(params.id, session.userId)

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Increment view count in background (don't await)
    incrementViewCount(params.id).catch(console.error)

    return NextResponse.json({ data: document })
  } catch (err) {
    console.error('GET /api/documents/[id] error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const result = updateDocumentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const document = await updateDocument(params.id, session.userId, result.data)

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or unauthorized' },
        { status: 404 }
      )
    }

    // Invalidate cached pages that show this document
    revalidatePath('/documents')
    revalidatePath(`/documents/${params.id}`)
    revalidatePath('/dashboard')

    return NextResponse.json({ data: document })
  } catch (err) {
    console.error('PATCH /api/documents/[id] error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const isAdmin = session.role === 'admin'

    // Get document first to check for file key
    const existing = await getDocumentById(params.id, session.userId)
    if (!existing) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const deleted = await deleteDocument(params.id, session.userId, isAdmin)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Document not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete file from R2 if it exists
    if (existing.fileKey) {
      deleteFile(existing.fileKey).catch(console.error)
    }

    // Invalidate cached pages that listed this document
    revalidatePath('/documents')
    revalidatePath('/dashboard')

    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (err) {
    console.error('DELETE /api/documents/[id] error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
