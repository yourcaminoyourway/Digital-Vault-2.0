import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

const TAGS_POOL = [
  'important',
  'draft',
  'final',
  'review',
  'approved',
  'archived',
  'confidential',
  'public',
  'internal',
  'external',
  'tax',
  'legal',
  'contract',
  'invoice',
  'receipt',
  'report',
  'presentation',
  'notes',
  'manual',
  'guide',
]

const DESCRIPTIONS = [
  'This document contains important information for reference.',
  'Quarterly report generated automatically.',
  'Supporting documentation for the main project.',
  'Review copy — not for distribution.',
  'Final approved version.',
  'Draft in progress — subject to change.',
  'Confidential document for internal use only.',
  'Public facing document approved for release.',
  'Technical specifications and requirements.',
  'Meeting notes and action items.',
]

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomTags(): string[] {
  const count = Math.floor(Math.random() * 4) + 1
  const shuffled = [...TAGS_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

async function seed() {
  console.log('🌱 Starting seed...')

  // Create admin user
  const adminHash = await bcrypt.hash('Admin123!', 12)
  const [adminUser] = await db
    .insert(schema.users)
    .values({
      email: 'admin@digitalvault.com',
      passwordHash: adminHash,
      fullName: 'Admin User',
      role: 'admin',
      isActive: true,
    })
    .onConflictDoNothing()
    .returning()

  // Create regular user
  const userHash = await bcrypt.hash('User123!', 12)
  const [regularUser] = await db
    .insert(schema.users)
    .values({
      email: 'user@digitalvault.com',
      passwordHash: userHash,
      fullName: 'Test User',
      role: 'user',
      isActive: true,
    })
    .onConflictDoNothing()
    .returning()

  if (!adminUser || !regularUser) {
    // Users already exist — fetch them
    console.log('Users already exist, fetching...')
    const existingUsers = await db.select().from(schema.users)
    const existingAdmin = existingUsers.find((u) => u.email === 'admin@digitalvault.com')
    const existingUser = existingUsers.find((u) => u.email === 'user@digitalvault.com')
    if (!existingAdmin || !existingUser) {
      console.error('Could not find seed users. Exiting.')
      process.exit(1)
    }
    await seedDocuments(existingAdmin.id, existingUser.id)
    return
  }

  console.log(`✅ Created users: ${adminUser.email}, ${regularUser.email}`)

  await seedDocuments(adminUser.id, regularUser.id)
}

async function seedDocuments(adminId: string, userId: string) {
  // Create categories for admin
  const adminCategoryData = [
    { name: 'Work', color: '#6366f1', userId: adminId },
    { name: 'Personal', color: '#10b981', userId: adminId },
    { name: 'Finance', color: '#f59e0b', userId: adminId },
  ]

  const adminCategories = await db
    .insert(schema.categories)
    .values(adminCategoryData)
    .onConflictDoNothing()
    .returning()

  console.log(`✅ Created ${adminCategories.length} categories for admin`)

  // Create categories for regular user
  const userCategoryData = [
    { name: 'Work', color: '#6366f1', userId: userId },
    { name: 'Personal', color: '#10b981', userId: userId },
    { name: 'Finance', color: '#f59e0b', userId: userId },
  ]

  const userCategories = await db
    .insert(schema.categories)
    .values(userCategoryData)
    .onConflictDoNothing()
    .returning()

  console.log(`✅ Created ${userCategories.length} categories for user`)

  const allAdminCats = adminCategories.length > 0 ? adminCategories : []
  const allUserCats = userCategories.length > 0 ? userCategories : []

  // Seed 10,000 documents in batches of 100
  const TOTAL_DOCS = 10000
  const BATCH_SIZE = 100

  console.log(`📄 Seeding ${TOTAL_DOCS} documents in batches of ${BATCH_SIZE}...`)

  for (let i = 0; i < TOTAL_DOCS; i += BATCH_SIZE) {
    const batch = []
    for (let j = 0; j < BATCH_SIZE && i + j < TOTAL_DOCS; j++) {
      const docIndex = i + j + 1
      const isAdminDoc = docIndex % 2 === 0
      const ownerId = isAdminDoc ? adminId : userId
      const ownerCats = isAdminDoc ? allAdminCats : allUserCats

      const categoryId =
        ownerCats.length > 0
          ? randomFrom(ownerCats).id
          : null

      batch.push({
        title: `Document ${docIndex}`,
        description: randomFrom(DESCRIPTIONS),
        userId: ownerId,
        categoryId: categoryId,
        isPublic: Math.random() > 0.7,
        tags: randomTags(),
        viewCount: Math.floor(Math.random() * 100),
      })
    }

    await db.insert(schema.documents).values(batch)

    if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= TOTAL_DOCS) {
      const done = Math.min(i + BATCH_SIZE, TOTAL_DOCS)
      console.log(`  Progress: ${done}/${TOTAL_DOCS} documents inserted`)
    }
  }

  console.log('✅ Seed complete!')
  console.log('')
  console.log('Sample credentials:')
  console.log('  Admin: admin@digitalvault.com / Admin123!')
  console.log('  User:  user@digitalvault.com  / User123!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
