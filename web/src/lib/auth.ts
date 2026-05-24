import * as jose from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export type JWTPayload = {
  userId: string
  email: string
  role: 'admin' | 'user'
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-dev-secret-change-in-production'
)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function signToken(payload: JWTPayload): Promise<string> {
  const token = await new jose.SignJWT(payload as jose.JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
  return token
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as 'admin' | 'user',
    }
  } catch {
    return null
  }
}

export async function getSession(
  request?: NextRequest
): Promise<JWTPayload | null> {
  let token: string | undefined

  if (request) {
    // 1. Try cookie (web)
    token = request.cookies.get('auth-token')?.value
    // 2. Fall back to Authorization: Bearer <token> (mobile)
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim()
      }
    }
  } else {
    const cookieStore = await cookies()
    token = cookieStore.get('auth-token')?.value
  }

  if (!token) return null
  return verifyToken(token)
}

export function setAuthCookie(token: string): {
  name: string
  value: string
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax'
  maxAge: number
  path: string
} {
  return {
    name: 'auth-token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  }
}
