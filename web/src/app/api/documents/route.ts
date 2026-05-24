import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDocuments, createDocument } from '@/services/documentService'

// Always run fresh — never serve stale cached data
export const dynamic = 'force-dynamic'

const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  isPublic: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  fileUrl: z.string().url().optional().nullable(),
  fileKey: z.string().optional().nullable(),
  fileSize: z.number().int().positive().optional().nullable(),
  mimeType: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const search = searchParams.get('search') ?? undefined
    const categoryId = searchParams.get('categoryId') ?? undefined
    const sortBy = (searchParams.get('sortBy') ?? 'createdAt') as 'createdAt' | 'title' | 'viewCount'
    const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc'

    const result = await getDocuments(session.userId, {
      page,
      limit,
      search,
      categoryId,
      sortBy,
      sortOrder,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /api/documents error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const result = createDocumentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const document = await createDocument(session.userId, result.data)

    revalidatePath('/documents')
    revalidatePath('/dashboard')

    return NextResponse.json({ data: document }, { status: 201 })
  } catch (err) {
    console.error('POST /api/documents error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
