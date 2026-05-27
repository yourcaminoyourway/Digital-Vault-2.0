# Digital Vault 2.0

A secure, multi-platform document management system for individuals and teams. Store, organize, edit and share documents with role-based access control, full-text search, categories, tags, and file attachments — all backed by a single PostgreSQL database and consumed by both a Next.js web app and an Expo mobile app.

Built as a SoftUni "Full Stack Apps with AI" capstone project (May 2026).

## 🚀 Live Demo

| | URL |
|---|---|
| **Web app** | https://digitalvault2.netlify.app |
| **Mobile (Expo web export)** | https://digitalvault2-mobile.netlify.app |
| **Source** | https://github.com/yourcaminoyourway/Digital-Vault-2.0 |

> Demo login credentials are provided separately in the submission form. You can also register a fresh account directly at the live URL — new accounts are automatically given 4 default categories (Personal, Work, Finance, Other).

## Highlights

- **Real file uploads** — store, replace, download, and delete document files end-to-end. Caps: 3 MB per file, 10 files per user (so a 500 MB free Neon DB stays comfortably under quota).
- **10 000+ seeded documents** so paging, sorting and search are tested under realistic load.
- **Cross-origin Bearer-token auth** so the same Next.js API serves both the web app (cookie) and the mobile app (Authorization header).
- **Admin panel** with user search, role management, and dashboard stats.
- **Default-aware** — new users get a starter set of categories on registration; existing users with missing defaults are backfilled on next request.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                          CLIENTS                             │
│                                                              │
│   Browser (Next.js Web)         Mobile (Expo React Native)   │
│   • Server Components            • Tabs + stack routing      │
│   • Server Actions               • REST via axios + Bearer   │
│   • Cookies (httpOnly)           • SecureStore for token     │
└────────┬─────────────────────────────────────┬───────────────┘
         │                                     │
         ▼                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js App (web/)                         │
│                                                             │
│  App Router pages  │  REST API routes  │  Server Actions    │
│  (10+ screens)     │  /api/**          │  for form submits  │
│         │                 │                   │             │
│         ▼                 ▼                   ▼             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Services layer                          │    │
│  │  documentService · userService · auth · r2 · format  │    │
│  └────────────────────────┬─────────────────────────────┘    │
│                           │                                 │
│                  ┌────────▼─────────┐                       │
│                  │  Drizzle ORM     │                       │
│                  └────────┬─────────┘                       │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │   Neon serverless PG      │
              │  (5 tables · 10k seed)    │
              │  Files stored as BYTEA    │
              └───────────────────────────┘
```

### Communication

- **Web ↔ API**: Server Components fetch via direct service calls; client components use `fetch('/api/...')`. Auth via `auth-token` httpOnly cookie.
- **Mobile ↔ API**: axios → `https://digitalvault2.netlify.app/api/...` with `Authorization: Bearer <token>` header. Token stored in `expo-secure-store` (native) or `localStorage` (web export).

## Tech Stack

| Layer | Technology |
|---|---|
| Web framework | Next.js 14 (App Router) |
| Mobile framework | Expo SDK 54 + Expo Router |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 (web), React Native StyleSheet (mobile) |
| Database | Neon serverless PostgreSQL |
| ORM | Drizzle ORM + Drizzle Kit migrations |
| Auth | JWT via `jose` (HS256, 7-day expiry) |
| Passwords | bcryptjs (12 rounds) |
| File storage | PostgreSQL `BYTEA` column (with R2 code stub for swap-out) |
| Validation | Zod schemas at every API boundary |
| HTTP client | axios (mobile), native fetch (web) |
| Hosting | Netlify (web + mobile-web), Neon (DB) |

## Database Schema

5 tables with relationships and indexes.

```
users 1───* categories
  │  1───* documents 1───* document_shares *───1 users
  │                                              ▲
  └────────────────────────────────────────* audit_logs (nullable user)
```

### `users`
PK `id` · `email` UNIQUE · `password_hash` (bcrypt) · `full_name` · `role` (admin/user) · `avatar_url` · `is_active` · timestamps

### `categories`
PK `id` · `name` · `color` (hex) · FK `user_id` (CASCADE delete) · `created_at`

### `documents`
PK `id` · `title` · `description` · `tags[]` · FK `category_id` (SET NULL) · FK `user_id` (CASCADE) · `is_public` · `view_count` · timestamps
**File columns:** `file_name`, `file_size`, `mime_type`, `file_url`, `file_key`, `file_data` (BYTEA — only fetched on download)
**Indexes:** `user_id`, `category_id`, `created_at`, `is_public` — keeps the 10 000-row list page fast.

### `document_shares`
PK `id` · FK `document_id` (CASCADE) · FK `shared_with_user_id` (CASCADE) · `can_edit` · `created_at`

### `audit_logs`
PK `id` · FK `user_id` (SET NULL) · `action` · `resource_type` · `resource_id` · `details` (JSON) · `created_at`
**Indexes:** `user_id`, `created_at`

All schema changes go through Drizzle migrations in `web/drizzle/migrations/`.

## Repository Structure

```
digital-vault-2.0/
├── web/                              # Next.js 14 app
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/              # login, register
│   │   │   ├── api/                 # REST endpoints (see below)
│   │   │   ├── actions/             # Server Actions
│   │   │   ├── admin/               # Admin panel
│   │   │   ├── dashboard/           # Authenticated home
│   │   │   ├── documents/           # List · new · [id] · [id]/edit
│   │   │   ├── profile/             # Edit name + change password
│   │   │   └── page.tsx             # Public landing
│   │   ├── components/              # navbar, document-card, modals…
│   │   ├── lib/
│   │   │   ├── db/                  # schema.ts, seed.ts, client
│   │   │   ├── auth.ts              # JWT + session helpers
│   │   │   ├── r2.ts                # R2 stub (future-proof)
│   │   │   └── format.ts            # formatFileSize helper
│   │   ├── services/                # documentService, userService
│   │   ├── middleware.ts            # route protection + CORS
│   │   └── types/
│   ├── drizzle/migrations/          # SQL migration files (committed)
│   └── netlify.toml                 # (legacy; superseded by root)
├── mobile/                           # Expo React Native app
│   ├── app/
│   │   ├── (auth)/login.tsx · register.tsx
│   │   ├── (tabs)/index.tsx · documents.tsx · profile.tsx
│   │   └── document/new.tsx · [id].tsx · edit/[id].tsx
│   ├── components/                  # DocumentCard, EmptyState, etc.
│   ├── context/AuthContext.tsx
│   ├── services/api.ts              # axios + interceptors
│   ├── lib/format.ts                # shared size formatter
│   └── constants/api.ts
├── netlify.toml                      # base="web" config used for prod
├── AGENTS.md                         # AI agent / contributor guide
└── README.md
```

## API Endpoints

Auth + sessions:

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Create account, auto-seed default categories | Public |
| POST | `/api/auth/login` | Returns user + JWT in body **and** cookie | Public |
| POST | `/api/auth/logout` | Clear cookie | Public |
| GET | `/api/auth/me` | Current user | Required |
| POST | `/api/auth/change-password` | bcrypt verify + replace | Required |

Documents:

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/api/documents` | List with paging, search, category, sort | Required |
| POST | `/api/documents` | Create | Required |
| GET | `/api/documents/:id` | Read (own or public) | Required |
| PATCH | `/api/documents/:id` | Update metadata | Owner |
| DELETE | `/api/documents/:id` | Delete | Owner/Admin |
| POST | `/api/documents/:id/file` | Upload / replace file (3 MB, 10 files/user) | Owner |
| GET | `/api/documents/:id/file` | Stream file with proper headers | Owner/Public |
| DELETE | `/api/documents/:id/file` | Detach file, keep document | Owner |

Other:

| Method | Path | Description | Access |
|---|---|---|---|
| GET | `/api/categories` | List own categories (backfills defaults) | Required |
| POST | `/api/categories` | Create category | Required |
| GET | `/api/users` | Search users + counts | Admin |
| PATCH | `/api/users` | Change role / active state | Admin |
| PATCH | `/api/users/me` | Update own profile (name) | Required |

All endpoints return a consistent `{ data?, error?, message? }` shape. CORS headers + OPTIONS preflight are handled in `middleware.ts` so the mobile-web build can call the API cross-origin.

## Web Screens (10+)

`/` landing · `/login` · `/register` · `/dashboard` · `/documents` (list + filters + paging) · `/documents/new` (create + file) · `/documents/[id]` (detail + download) · `/documents/[id]/edit` (metadata + file replace/remove) · `/profile` (name + password) · `/admin` (user search + roles)

## Mobile Screens (7+)

`(auth)/login` · `(auth)/register` · `(tabs)/index` (home + recent docs) · `(tabs)/documents` (search + paged list + pull-to-refresh) · `(tabs)/profile` · `document/new` · `document/[id]` (with download) · `document/edit/[id]`

## Local Development

### Prerequisites
- Node.js 20+
- npm 10+
- A free Neon PostgreSQL database (https://neon.tech)

### 1. Clone and install
```bash
git clone https://github.com/yourcaminoyourway/Digital-Vault-2.0.git
cd Digital-Vault-2.0
cd web && npm install
cd ../mobile && npm install --legacy-peer-deps
```

### 2. Configure environment
```bash
cp .env.example web/.env.local
# Then edit web/.env.local and set:
#   DATABASE_URL=<your Neon connection string>
#   JWT_SECRET=<any random 32+ char string>
```

### 3. Push schema + seed
```bash
cd web
export $(grep DATABASE_URL .env.local | xargs)
npx drizzle-kit push       # apply schema
npm run db:seed            # creates 10 000 documents + 2 demo users
```

### 4. Start the web app
```bash
cd web
npx next dev -H 0.0.0.0    # http://localhost:3000
```

### 5. Start the mobile app
```bash
cd mobile
npx expo start --clear     # scan QR with Expo Go (SDK 54)
```

For LAN access from your phone, edit `mobile/constants/api.ts` and replace `digitalvault2.netlify.app` with `http://<your-mac-IP>:3000`.

## Deployment

Both apps deploy to Netlify, both talk to the same Neon database.

### Web app
The root `netlify.toml` sets `base="web"`, `command="npm run build"`, `publish=".next"`, and includes the `@netlify/plugin-nextjs` plugin and CORS headers for `/api/*`. Required env vars in Netlify:
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL` (your Netlify URL, after first deploy)

### Mobile (Expo web export)
```bash
cd mobile
npx expo export --platform web
# A dist/ folder is produced. Drop it onto a Netlify "deploy manually" site.
# dist/_redirects is included so client-side routing works.
```

The mobile web build hits the live web API (URL hard-coded in `mobile/constants/api.ts`).

## Demo / submission notes

- **5 tables** in DB (users, categories, documents, document_shares, audit_logs)
- **10 000+ documents** seeded for scalability testing
- **15+ commits** across multiple days — see `git log`
- **AGENTS.md** describes architectural conventions for AI dev tools
- **No external secrets in repo** — all secrets live in Netlify / `.env.local`

Built end-to-end with AI-assisted development (Claude Code).
