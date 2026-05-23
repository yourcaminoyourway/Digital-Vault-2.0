CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "audit_logs" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_user_id" ON "documents" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_category_id" ON "documents" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_created_at" ON "documents" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_is_public" ON "documents" ("is_public");