import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'
import { eq, and, or, sql, count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// Demo storage caps — keeps us well under Neon's 500MB free tier.
const MAX_FILE_BYTES = 3 * 1024 * 1024 // 3 MB
const MAX_FILES_PER_USER = 10

/**
 * GET — stream the file bytes for download.
 * Allowed for: doc owner, OR any logged-in user if doc.isPublic.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const rows = await db
      .select({
        userId: documents.userId,
        isPublic: documents.isPublic,
        fileData: documents.fileData,
        fileName: documents.fileName,
        mimeType: documents.mimeType,
        fileSize: documents.fileSize,
      })
      .from(documents)
      .where(
        and(
          eq(documents.id, params.id),
          or(
            eq(documents.userId, session.userId),
            eq(documents.isPublic, true)
          )
        )
      )
      .limit(1)

    const doc = rows[0]
    if (!doc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    if (!doc.fileData) {
      return NextResponse.json(
        { error: 'This document has no attached file' },
        { status: 404 }
      )
    }

    const filename = doc.fileName ?? `document-${params.id}`
    const mimeType = doc.mimeType ?? 'application/octet-stream'

    // BYTEA serialization depends on the driver. With @neondatabase/serverless
    // HTTP, it comes back as a hex-encoded string like "\x48656c6c6f". Normalize
    // every shape we might see into a Buffer.
    const raw = doc.fileData as unknown
    let buffer: Buffer
    if (Buffer.isBuffer(raw)) {
      buffer = raw
    } else if (raw instanceof Uint8Array) {
      buffer = Buffer.from(raw)
    } else if (typeof raw === 'string') {
      // Postgres bytea hex format
      const hex = raw.startsWith('\\x') ? raw.slice(2) : raw
      buffer = Buffer.from(hex, 'hex')
    } else if (
      raw &&
      typeof raw === 'object' &&
      Array.isArray((raw as { data?: unknown }).data)
    ) {
      buffer = Buffer.from((raw as { data: number[] }).data)
    } else {
      console.error('Unknown BYTEA shape:', typeof raw, raw)
      return NextResponse.json(
        { error: 'Could not read file from storage' },
        { status: 500 }
      )
    }

    // Convert Node Buffer to a clean ArrayBuffer slice so Next/Fetch
    // sends raw bytes (not JSON-serialized Buffer).
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('GET /api/documents/[id]/file error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST — upload (or replace) the file attached to this document.
 * Multipart form-data with a single 'file' field.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Confirm the user owns this document
    const ownerRows = await db
      .select({
        userId: documents.userId,
        existingFileData: documents.fileData,
      })
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1)

    const owned = ownerRows[0]
    if (!owned) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    if (owned.userId !== session.userId) {
      return NextResponse.json(
        { error: 'You can only upload files to your own documents' },
        { status: 403 }
      )
    }

    // Demo cap: if this document doesn't already have a file, count
    // how many files the user has stored. Replacing an existing file
    // is always allowed (doesn't add to count).
    if (!owned.existingFileData) {
      const userFileCount = await db
        .select({ value: count() })
        .from(documents)
        .where(
          and(
            eq(documents.userId, session.userId),
            sql`${documents.fileData} is not null`
          )
        )
      const total = userFileCount[0]?.value ?? 0
      if (total >= MAX_FILES_PER_USER) {
        return NextResponse.json(
          {
            error: `Demo limit reached: ${MAX_FILES_PER_USER} files per user. Delete a file first to upload a new one.`,
          },
          { status: 400 }
        )
      }
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File appears to be empty' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          error: `File too large. Max ${MAX_FILE_BYTES / 1024 / 1024} MB.`,
        },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    await db
      .update(documents)
      .set({
        fileData: buffer,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        // mark "has file" by setting a sentinel in fileKey too,
        // so existing code that checks fileUrl / fileKey still works
        fileKey: `db:${params.id}`,
        fileUrl: `/api/documents/${params.id}/file`,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, params.id))

    revalidatePath('/documents')
    revalidatePath(`/documents/${params.id}`)

    return NextResponse.json({
      data: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: `/api/documents/${params.id}/file`,
      },
      message: 'File uploaded successfully',
    })
  } catch (err) {
    console.error('POST /api/documents/[id]/file error:', err)
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE — detach (remove) the file from this document but keep the
 * document and its metadata.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const ownerRows = await db
      .select({ userId: documents.userId })
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1)

    const doc = ownerRows[0]
    if (!doc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    if (doc.userId !== session.userId) {
      return NextResponse.json(
        { error: 'You can only modify your own documents' },
        { status: 403 }
      )
    }

    await db
      .update(documents)
      .set({
        fileData: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        fileKey: null,
        fileUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, params.id))

    revalidatePath('/documents')
    revalidatePath(`/documents/${params.id}`)

    return NextResponse.json({ message: 'File removed successfully' })
  } catch (err) {
    console.error('DELETE /api/documents/[id]/file error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
