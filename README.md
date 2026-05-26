# Digital Vault 2.0

A secure, multi-platform document management system for individuals and teams. Store, organize, and share documents with role-based access control, full-text search, and cloud file storage.

## 🚀 Live Demo

| | URL |
|---|---|
| **Web app** | https://digitalvault2.netlify.app |
| **Mobile (web export)** | https://glistening-gecko-36e676.netlify.app |
| **Source** | https://github.com/yourcaminoyourway/Digital-Vault-2.0 |

### Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@digitalvault.com` | `Admin123!` |
| User | `user@digitalvault.com` | `User123!` |

Or register your own account at the live URL.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│                                                             │
│   Browser (Next.js Web)      Mobile (Expo React Native)     │
│        │                              │                     │
└────────┼──────────────────────────────┼─────────────────────┘
         │                              │
         ▼                              ▼
┌────────────────────────────────────────────────────────────┐
│                   Next.js Web App (web/)                   │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  App Router  │  │  API Routes  │  │ Server Actions  │  │
│  │   (Pages)    │  │ /api/**      │  │  (Form Submit)  │  │
│  └──────────────┘  └──────┬───────┘  └────────┬────────┘  │
│                           │                    │           │
│  ┌────────────────────────▼────────────────────▼────────┐  │
│  │                  Services Layer                       │  │
│  │         documentService.ts / userService.ts           │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │                                  │
│  ┌──────────────────────▼────────────────────────────────┐  │
│  │              Drizzle ORM + Schema                      │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Neon PostgreSQL     │
              │   (Serverless DB)     │
              └───────────────────────┘

File uploads → Cloudflare R2 (S3-compatible object storage)
Auth         → JWT tokens (jose) stored in httpOnly cookies / SecureStore
```

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Web Framework | Next.js 14 (App Router) | SSR/SSG web application |
| Language | TypeScript 5 | Type safety across full stack |
| Styling | Tailwind CSS 3 | Utility-first CSS |
| ORM | Drizzle ORM | Type-safe database queries |
| Database | Neon PostgreSQL | Serverless PostgreSQL |
| Auth | JWT via jose | Stateless authentication |
| Passwords | bcryptjs | Secure password hashing |
| File Storage | Cloudflare R2 | S3-compatible object storage |
| Validation | Zod | Runtime type validation |
| Mobile | Expo SDK 51 | Cross-platform React Native |
| Mobile Routing | Expo Router | File-based mobile navigation |
| Mobile Auth | expo-secure-store | Secure token storage |
| Icons | lucide-react | Web icon library |

## Database Schema

### users
| Column | Type | Description |
|---|---|---|
| id | uuid PK | Primary key |
| email | varchar(255) UNIQUE | User email |
| password_hash | varchar(255) | bcrypt hash |
| full_name | varchar(255) | Display name |
| role | enum(admin,user) | Access role |
| avatar_url | text | Profile picture URL |
| is_active | boolean | Account status |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

### documents
| Column | Type | Description |
|---|---|---|
| id | uuid PK | Primary key |
| title | varchar(255) | Document title |
| description | text | Optional description |
| file_url | text | Public file URL (R2) |
| file_key | text | R2 object key |
| file_size | integer | File size in bytes |
| mime_type | varchar(100) | MIME type |
| tags | text[] | Array of tags |
| category_id | uuid FK | Category reference |
| user_id | uuid FK | Owner reference |
| is_public | boolean | Public visibility |
| view_count | integer | Number of views |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

### categories
| Column | Type | Description |
|---|---|---|
| id | uuid PK | Primary key |
| name | varchar(100) | Category name |
| color | varchar(7) | Hex color code |
| user_id | uuid FK | Owner reference |
| created_at | timestamp | Creation time |

### document_shares
| Column | Type | Description |
|---|---|---|
| id | uuid PK | Primary key |
| document_id | uuid FK | Document reference |
| shared_with_user_id | uuid FK | Recipient user |
| can_edit | boolean | Edit permission |
| created_at | timestamp | Share time |

### audit_logs
| Column | Type | Description |
|---|---|---|
| id | uuid PK | Primary key |
| user_id | uuid FK | Actor (nullable) |
| action | varchar(100) | Action performed |
| resource_type | varchar(50) | Resource type |
| resource_id | uuid | Resource ID |
| details | text | JSON details |
| created_at | timestamp | Event time |

## Repository Structure

```
digital-vault-2.0/
├── web/                          # Next.js 14 web application
│   ├── src/
│   │   ├── app/                  # App Router pages and API routes
│   │   │   ├── (auth)/          # Auth group (login, register)
│   │   │   ├── api/             # REST API endpoints
│   │   │   │   ├── auth/        # login, register, logout, me
│   │   │   │   ├── documents/   # CRUD + upload
│   │   │   │   ├── categories/  # Category management
│   │   │   │   ├── users/       # Admin user management
│   │   │   │   └── upload/      # R2 file upload
│   │   │   ├── actions/         # Server Actions
│   │   │   ├── dashboard/       # Dashboard page
│   │   │   ├── documents/       # Document pages
│   │   │   ├── profile/         # User profile
│   │   │   └── admin/           # Admin panel
│   │   ├── components/          # Reusable React components
│   │   ├── lib/
│   │   │   ├── db/              # Drizzle schema, client, seed
│   │   │   ├── auth.ts          # JWT utilities
│   │   │   └── r2.ts            # Cloudflare R2 service
│   │   ├── services/            # Business logic layer
│   │   └── types/               # TypeScript types
│   ├── drizzle/
│   │   └── migrations/          # SQL migration files
│   └── drizzle.config.ts        # Drizzle Kit config
│
└── mobile/                      # Expo React Native app
    ├── app/                     # Expo Router pages
    │   ├── (auth)/              # Login, register screens
    │   ├── (tabs)/              # Tab navigator screens
    │   └── document/            # Document detail/create
    ├── components/              # React Native components
    ├── context/                 # AuthContext
    ├── services/                # API service (axios)
    └── constants/               # API URLs
```

## Local Development Setup

### Prerequisites
- Node.js 20+
- npm 10+
- A Neon PostgreSQL database (free tier at neon.tech)
- (Optional) Cloudflare R2 bucket for file uploads

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd digital-vault-2.0
cd web && npm install
cd ../mobile && npm install
```

### 2. Configure Environment

```bash
cp .env.example web/.env.local
# Edit web/.env.local and fill in:
# DATABASE_URL — your Neon connection string
# JWT_SECRET   — a random 32+ character string
```

### 3. Run Database Migrations

```bash
cd web
npm run db:migrate
```

### 4. Seed the Database (Optional — creates 10,000 sample documents)

```bash
cd web
npm run db:seed
```

### 5. Start the Web App

```bash
cd web
npm run dev
# Open http://localhost:3000
```

### 6. Start the Mobile App (Optional)

```bash
cd mobile
npm run start
# Scan QR code with Expo Go app
```

## Deployment

### Web App (Netlify)

1. Connect your GitHub repo to Netlify
2. Set build command: `cd web && npm install && npm run build`
3. Set publish directory: `web/.next`
4. Add the `@netlify/plugin-nextjs` plugin
5. Set environment variables in Netlify dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL` (your Netlify URL)
   - R2 variables (if using file uploads)

### Mobile (Expo Web Export to Netlify)

```bash
cd mobile
npm run web
# Or for static export:
npx expo export --platform web
# Deploy the dist/ folder to Netlify
```

## Sample Credentials

After running `npm run db:seed`:

| Role | Email | Password |
|---|---|---|
| Admin | admin@digitalvault.com | Admin123! |
| User | user@digitalvault.com | User123! |

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | /api/auth/register | Create account | Public |
| POST | /api/auth/login | Login | Public |
| POST | /api/auth/logout | Logout | Any |
| GET | /api/auth/me | Current user | Required |
| GET | /api/documents | List documents | Required |
| POST | /api/documents | Create document | Required |
| GET | /api/documents/:id | Get document | Required |
| PATCH | /api/documents/:id | Update document | Owner |
| DELETE | /api/documents/:id | Delete document | Owner/Admin |
| GET | /api/categories | List categories | Required |
| POST | /api/categories | Create category | Required |
| POST | /api/upload | Upload file to R2 | Required |
| GET | /api/users | List users | Admin |
