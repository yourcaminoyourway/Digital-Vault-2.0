import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth'
import { getUserByEmail, createUser } from '@/services/userService'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'

const DEFAULT_CATEGORIES = [
  { name: 'Personal', color: '#6366f1' },
  { name: 'Work', color: '#10b981' },
  { name: 'Finance', color: '#f59e0b' },
  { name: 'Other', color: '#8b5cf6' },
]

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(255),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password, fullName } = result.data

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)
    const user = await createUser({ email, passwordHash, fullName, role: 'user', isActive: true })

    // Seed default categories so new users have something to organize with
    try {
      await db.insert(categories).values(
        DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id }))
      )
    } catch (catErr) {
      console.error('Failed to seed default categories:', catErr)
      // non-fatal — user can create their own
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const cookieOptions = setAuthCookie(token)
    const response = NextResponse.json(
      {
        data: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        token,
        message: 'Account created successfully',
      },
      { status: 201 }
    )

    response.cookies.set(cookieOptions)
    return response
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
