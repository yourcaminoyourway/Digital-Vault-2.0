# Digital Vault 2.0 — AI Agent Instructions

## App Context
Digital Vault 2.0 is a multi-platform document management system that allows individuals and teams to securely store, organize, and share documents. It supports role-based access control (admin/user), document categorization, tagging, public/private sharing, and audit logging.

## Architecture
This is an npm workspaces monorepo with two packages:
- `web/` — Next.js 14 App Router web application (the primary backend and web frontend)
- `mobile/` — Expo Router React Native mobile application (connects to the Next.js REST API)

```
digital-vault-2.0/
├── web/          # Next.js 14 + TypeScript + Tailwind
└── mobile/       # Expo + React Native + TypeScript
```

## Tech Stack
| Layer | Technology |
|---|---|
| Web Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| ORM | Drizzle ORM |
| Database | Neon PostgreSQL (serverless) |
| Auth | JWT via jose library, httpOnly cookies |
| File Storage | PostgreSQL BYTEA column (demo); R2 stub kept for future migration |
| Mobile | Expo SDK 54 + Expo Router |
| Validation | Zod |
| Password Hashing | bcryptjs |

## Database Rules — CRITICAL
- ALWAYS use Drizzle migrations for schema changes. NEVER modify the database schema directly via SQL or the Neon console.
- To change the schema:
  1. Edit `web/src/lib/db/schema.ts`
  2. Run `npm run db:generate` (inside `web/`) to generate a new migration file
  3. Run `npm run db:migrate` (inside `web/`) to apply the migration
- Migration files live in `web/drizzle/migrations/`
- The seed script is at `web/src/lib/db/seed.ts` — run with `npm run db:seed`
- Never use raw SQL to alter tables unless absolutely necessary for a hotfix

## API Architecture
- RESTful API routes live in `web/src/app/api/`
- Server Actions (for form submissions) live in `web/src/app/actions/`
- All API routes that require auth must call `getSession(request)` from `web/src/lib/auth.ts`
- Return consistent shapes: `{ data, error, message }` for single resources; `{ data, total, page, totalPages }` for paginated lists
- Use Zod for all request body validation
- HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

## Authentication
- JWT tokens are signed with HS256 using the `jose` library
- Tokens are stored in an httpOnly cookie named `auth-token`
- Token payload: `{ userId, email, role, iat, exp }`
- Token expiry: 7 days
- The middleware at `web/src/middleware.ts` protects dashboard, documents, profile, and admin routes
- Admin routes require `role === 'admin'` in the JWT payload
- The mobile app stores the token in `expo-secure-store` under the key `auth-token`

## File Uploads
- Files are stored as `BYTEA` directly in the `documents.file_data` column for the demo. The custom Drizzle type in `web/src/lib/db/schema.ts` handles hex serialization so values round-trip cleanly through the neon-http driver.
- Hard limits: **3 MB per file**, **10 files per user**, enforced server-side in `POST /api/documents/:id/file`.
- File-related endpoints all live under `/api/documents/:id/file`:
  - `POST` — upload or replace the file (multipart)
  - `GET` — stream the bytes with correct `Content-Type` + `Content-Disposition`
  - `DELETE` — detach the file but keep the document row
- List and detail queries explicitly project columns to **exclude `file_data`** so they don't load megabytes per row. Only the single file-download endpoint reads `file_data`.
- The mobile client picks files with `expo-document-picker`, uploads via axios FormData, and downloads via `expo-file-system.downloadAsync` (or a blob trick on web export).
- `web/src/lib/r2.ts` is a code stub kept for the day we outgrow BYTEA — wiring R2 back in only requires changing the upload + download endpoints; the DB columns `file_url` / `file_key` are reserved for that path.

## Mobile App
- The Expo app connects to the Next.js API — set `EXPO_PUBLIC_API_URL` in `mobile/.env`
- Auth token is persisted with `expo-secure-store`
- The API service is at `mobile/services/api.ts`
- Auth state is managed by `mobile/context/AuthContext.tsx`
- Navigation uses Expo Router with file-based routing
- Tab navigator has 3 tabs: Home (dashboard), Documents, Profile

## Code Patterns

### Services Layer
- Business logic lives in `web/src/services/`
- `documentService.ts` — all document CRUD and queries
- `userService.ts` — all user CRUD and queries
- Services use Drizzle ORM directly, never raw SQL

### Shared Types
- Shared TypeScript types in `web/src/types/index.ts`
- API response types: `ApiResponse<T>`, `PaginatedResponse<T>`
- Input types: `CreateDocumentInput`, `UpdateDocumentInput`

### Components
- All web components in `web/src/components/`
- Use `clsx` for conditional class names
- Use `lucide-react` for icons
- Client components must have `'use client'` directive at top

## Naming Conventions
- Variables and functions: camelCase (`getUserById`, `documentCount`)
- Components and Types: PascalCase (`DocumentCard`, `ApiResponse`)
- Files: kebab-case (`document-card.tsx`, `auth.ts`)
- Database columns: snake_case (handled by Drizzle schema mapping)
- Environment variables: SCREAMING_SNAKE_CASE

## Environment Variables
Web app env vars go in `web/.env.local` (never commit this file).
Required:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — minimum 32 characters, random

Optional (for file uploads):
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

## Common Commands
```bash
# Start web dev server
cd web && npm run dev

# Start mobile
cd mobile && npm run start

# Database operations (run from web/)
npm run db:generate   # Generate migration from schema changes
npm run db:migrate    # Apply pending migrations
npm run db:studio     # Open Drizzle Studio (DB GUI)
npm run db:seed       # Seed with sample data (10,000 documents)
```

## Sample Credentials (after seeding)
- Admin: `admin@digitalvault.com` / `Admin123!`
- User: `user@digitalvault.com` / `User123!`
