import { db } from '@/lib/db'
import { users, documents } from '@/lib/db/schema'
import { eq, count, desc, ilike, or } from 'drizzle-orm'
import type { NewUser } from '@/lib/db/schema'

export async function getUserById(id: string) {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  return rows[0] ?? null
}

export async function getUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)

  return rows[0] ?? null
}

export async function createUser(data: Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'>) {
  const [user] = await db
    .insert(users)
    .values({
      ...data,
      email: data.email.toLowerCase(),
    })
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })

  return user
}

export async function updateUser(
  id: string,
  data: Partial<{ fullName: string; avatarUrl: string; isActive: boolean; role: 'admin' | 'user'; passwordHash: string }>
) {
  const [user] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })

  return user ?? null
}

export async function getAllUsers(page = 1, limit = 20, search?: string) {
  const offset = (page - 1) * limit

  const whereClause = search
    ? or(
        ilike(users.email, `%${search}%`),
        ilike(users.fullName, `%${search}%`)
      )
    : undefined

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        documentCount: count(documents.id),
      })
      .from(users)
      .leftJoin(documents, eq(users.id, documents.userId))
      .where(whereClause)
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(users).where(whereClause),
  ])

  const total = totalResult[0]?.count ?? 0

  return {
    users: rows,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getUserStats(userId: string) {
  const [docCount] = await db
    .select({ count: count() })
    .from(documents)
    .where(eq(documents.userId, userId))

  return {
    documentCount: docCount?.count ?? 0,
  }
}
