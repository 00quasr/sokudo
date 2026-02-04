ALTER TABLE "users" ADD COLUMN "provider" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider_data" jsonb;