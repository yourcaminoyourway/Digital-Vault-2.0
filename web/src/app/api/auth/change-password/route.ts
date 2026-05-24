import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getSession,
  hashPassword,
  verifyPassword,
} from '@/lib/auth'
import { getUserById, updateUser } from '@/services/userService'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'Password too long'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = changePasswordSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = result.data

    // Load the full user record (including passwordHash) for verification
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)
    const user = rows[0]

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    const newHash = await hashPassword(newPassword)
    await updateUser(session.userId, { passwordHash: newHash })

    return NextResponse.json({ message: 'Password changed successfully' })
  } catch (err) {
    console.error('POST /api/auth/change-password error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
