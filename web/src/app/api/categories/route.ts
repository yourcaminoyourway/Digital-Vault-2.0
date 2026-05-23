import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex code')
    .optional()
    .default('#6366f1'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, session.userId))
      .orderBy(desc(categories.createdAt))

    return NextResponse.json({ data: userCategories })
  } catch (err) {
    console.error('GET /api/categories error:', err)
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
    const result = createCategorySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const [category] = await db
      .insert(categories)
      .values({
        ...result.data,
        userId: session.userId,
      })
      .returning()

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (err) {
    console.error('POST /api/categories error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
