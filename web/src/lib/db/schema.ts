import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  index,
  customType,
} from 'drizzle-orm/pg-core'

// Custom BYTEA type for storing small file binaries directly in PG.
// Used here for the demo file-storage feature (≤ 3 MB per file).
//
// The @neondatabase/serverless HTTP driver doesn't natively serialize a
// Node Buffer into BYTEA — it ends up JSON-stringifying it. So we encode
// to hex on the way in and decode on the way out.
const bytea = customType<{ data: Buffer; driverData: string }>({
  dataType() {
    return 'bytea'
  },
  toDriver(value: Buffer): string {
    return '\\x' + value.toString('hex')
  },
  fromDriver(value: unknown): Buffer {
    if (Buffer.isBuffer(value)) return value
    if (value instanceof Uint8Array) return Buffer.from(value)
    if (typeof value === 'string') {
      const hex = value.startsWith('\\x') ? value.slice(2) : value
      return Buffer.from(hex, 'hex')
    }
    if (
      value &&
      typeof value === 'object' &&
      Array.isArray((value as { data?: unknown }).data)
    ) {
      return Buffer.from((value as { data: number[] }).data)
    }
    return Buffer.alloc(0)
  },
})

export const userRoleEnum = pgEnum('user_role', ['admin', 'user'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).notNull().default('#6366f1'),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  fileUrl: text('file_url'),
  fileKey: text('file_key'),
  fileSize: integer('file_size'),
  fileName: varchar('file_name', { length: 255 }),
  fileData: bytea('file_data'),
  mimeType: varchar('mime_type', { length: 100 }),
  tags: text('tags').array(),
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  isPublic: boolean('is_public').notNull().default(false),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  userIdIdx: index('idx_documents_user_id').on(t.userId),
  categoryIdIdx: index('idx_documents_category_id').on(t.categoryId),
  createdAtIdx: index('idx_documents_created_at').on(t.createdAt),
  isPublicIdx: index('idx_documents_is_public').on(t.isPublic),
}))

export const documentShares = pgTable('document_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  sharedWithUserId: uuid('shared_with_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  canEdit: boolean('can_edit').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id'),
  details: text('details'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  userIdIdx: index('idx_audit_logs_user_id').on(t.userId),
  createdAtIdx: index('idx_audit_logs_created_at').on(t.createdAt),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type DocumentShare = typeof documentShares.$inferSelect
export type AuditLog = typeof auditLogs.$inferSelect
