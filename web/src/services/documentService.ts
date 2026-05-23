import { db } from '@/lib/db'
import { documents, categories } from '@/lib/db/schema'
import { eq, and, or, ilike, sql, desc, count, asc } from 'drizzle-orm'
import type { DocumentFilters, CreateDocumentInput, UpdateDocumentInput } from '@/types'

export async function getDocuments(
  userId: string,
  filters: DocumentFilters = {}
) {
  const { search, categoryId, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters
  const offset = (page - 1) * limit

  const conditions = [eq(documents.userId, userId)]

  if (search) {
    conditions.push(
      or(
        ilike(documents.title, `%${search}%`),
        ilike(documents.description, `%${search}%`),
        sql`array_to_string(${documents.tags}, ' ') ilike ${'%' + search + '%'}`,
        ilike(categories.name, `%${search}%`),
      )!
    )
  }

  if (categoryId) {
    conditions.push(eq(documents.categoryId, categoryId))
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: documents.id,
        title: documents.title,
        description: documents.description,
        fileUrl: documents.fileUrl,
        fileKey: documents.fileKey,
        fileSize: documents.fileSize,
        mimeType: documents.mimeType,
        tags: documents.tags,
        categoryId: documents.categoryId,
        userId: documents.userId,
        isPublic: documents.isPublic,
        viewCount: documents.viewCount,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(documents)
      .leftJoin(categories, eq(documents.categoryId, categories.id))
      .where(whereClause)
      .orderBy(
        sortOrder === 'asc'
          ? asc(sortBy === 'title' ? documents.title : sortBy === 'viewCount' ? documents.viewCount : documents.createdAt)
          : desc(sortBy === 'title' ? documents.title : sortBy === 'viewCount' ? documents.viewCount : documents.createdAt)
      )
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(documents)
      .leftJoin(categories, eq(documents.categoryId, categories.id))
      .where(whereClause),
  ])

  const total = totalResult[0]?.count ?? 0

  return {
    documents: rows,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  }
}

export async function getDocumentById(id: string, userId?: string) {
  const conditions = [eq(documents.id, id)]

  if (userId) {
    conditions.push(
      or(eq(documents.userId, userId), eq(documents.isPublic, true))!
    )
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      description: documents.description,
      fileUrl: documents.fileUrl,
      fileKey: documents.fileKey,
      fileSize: documents.fileSize,
      mimeType: documents.mimeType,
      tags: documents.tags,
      categoryId: documents.categoryId,
      userId: documents.userId,
      isPublic: documents.isPublic,
      viewCount: documents.viewCount,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(documents)
    .leftJoin(categories, eq(documents.categoryId, categories.id))
    .where(whereClause)
    .limit(1)

  return rows[0] ?? null
}

export async function createDocument(
  userId: string,
  data: CreateDocumentInput
) {
  const [doc] = await db
    .insert(documents)
    .values({
      ...data,
      userId,
    })
    .returning()

  return doc
}

export async function updateDocument(
  id: string,
  userId: string,
  data: UpdateDocumentInput
) {
  const [doc] = await db
    .update(documents)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    .returning()

  return doc ?? null
}

export async function deleteDocument(
  id: string,
  userId: string,
  isAdmin = false
) {
  const whereClause = isAdmin
    ? eq(documents.id, id)
    : and(eq(documents.id, id), eq(documents.userId, userId))

  const [deleted] = await db
    .delete(documents)
    .where(whereClause)
    .returning()

  return deleted ?? null
}

export async function incrementViewCount(id: string) {
  await db
    .update(documents)
    .set({ viewCount: sql`${documents.viewCount} + 1` })
    .where(eq(documents.id, id))
}

export async function getDocumentStats(userId: string) {
  const [stats] = await db
    .select({
      total: count(),
      publicCount: sql<number>`sum(case when ${documents.isPublic} then 1 else 0 end)::int`,
      totalViews: sql<number>`sum(${documents.viewCount})::int`,
    })
    .from(documents)
    .where(eq(documents.userId, userId))

  return {
    totalDocuments: stats?.total ?? 0,
    publicDocuments: stats?.publicCount ?? 0,
    privateDocuments: (stats?.total ?? 0) - (stats?.publicCount ?? 0),
    totalViews: stats?.totalViews ?? 0,
  }
}

export async function getRecentDocuments(userId: string, limit = 5) {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      description: documents.description,
      isPublic: documents.isPublic,
      viewCount: documents.viewCount,
      createdAt: documents.createdAt,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(documents)
    .leftJoin(categories, eq(documents.categoryId, categories.id))
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt))
    .limit(limit)
}
