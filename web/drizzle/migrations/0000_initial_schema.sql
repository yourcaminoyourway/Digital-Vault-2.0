-- Digital Vault 2.0 — Initial Schema Migration
-- Generated from Drizzle schema

-- Create enum type for user roles
DO $$ BEGIN
  CREATE TYPE "user_role" AS ENUM('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"         VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,
  "full_name"     VARCHAR(255) NOT NULL,
  "role"          "user_role" NOT NULL DEFAULT 'user',
  "avatar_url"    TEXT,
  "is_active"     BOOLEAN NOT NULL DEFAULT true,
  "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMP NOT NULL DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS "categories" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"       VARCHAR(100) NOT NULL,
  "color"      VARCHAR(7) NOT NULL DEFAULT '#6366f1',
  "user_id"    UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- Documents table
CREATE TABLE IF NOT EXISTS "documents" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"       VARCHAR(255) NOT NULL,
  "description" TEXT,
  "file_url"    TEXT,
  "file_key"    TEXT,
  "file_size"   INTEGER,
  "mime_type"   VARCHAR(100),
  "tags"        TEXT[],
  "category_id" UUID REFERENCES "categories"("id") ON DELETE SET NULL,
  "user_id"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "is_public"   BOOLEAN NOT NULL DEFAULT false,
  "view_count"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMP NOT NULL DEFAULT now()
);

-- Document shares table
CREATE TABLE IF NOT EXISTS "document_shares" (
  "id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id"          UUID NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "shared_with_user_id"  UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "can_edit"             BOOLEAN NOT NULL DEFAULT false,
  "created_at"           TIMESTAMP NOT NULL DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"       UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "action"        VARCHAR(100) NOT NULL,
  "resource_type" VARCHAR(50) NOT NULL,
  "resource_id"   UUID,
  "details"       TEXT,
  "created_at"    TIMESTAMP NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "documents_user_id_idx" ON "documents"("user_id");
CREATE INDEX IF NOT EXISTS "documents_category_id_idx" ON "documents"("category_id");
CREATE INDEX IF NOT EXISTS "documents_created_at_idx" ON "documents"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "categories_user_id_idx" ON "categories"("user_id");
CREATE INDEX IF NOT EXISTS "document_shares_document_id_idx" ON "document_shares"("document_id");
CREATE INDEX IF NOT EXISTS "document_shares_shared_with_user_id_idx" ON "document_shares"("shared_with_user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);
