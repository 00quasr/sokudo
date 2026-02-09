-- GitHub Repo Scanner Tables
CREATE TABLE IF NOT EXISTS "connected_repos" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "repo_url" text NOT NULL,
  "owner" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "default_branch" varchar(255) NOT NULL DEFAULT 'main',
  "is_private" boolean NOT NULL DEFAULT false,
  "last_scanned_at" timestamp,
  "scan_status" varchar(20) NOT NULL DEFAULT 'pending',
  "error_message" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "scanned_commands" (
  "id" serial PRIMARY KEY NOT NULL,
  "repo_id" integer NOT NULL,
  "source_file" varchar(500) NOT NULL,
  "raw_content" text NOT NULL,
  "extracted_command" text NOT NULL,
  "command_type" varchar(50) NOT NULL DEFAULT 'shell',
  "frequency" integer NOT NULL DEFAULT 1,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "repo_generated_challenges" (
  "id" serial PRIMARY KEY NOT NULL,
  "repo_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "scanned_command_id" integer,
  "content" text NOT NULL,
  "difficulty" varchar(20) NOT NULL DEFAULT 'beginner',
  "syntax_type" varchar(50) NOT NULL DEFAULT 'shell',
  "hint" text,
  "importance" integer NOT NULL DEFAULT 5,
  "is_selected" boolean NOT NULL DEFAULT true,
  "times_completed" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "repo_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "repo_id" integer NOT NULL,
  "name" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "description" text,
  "icon" varchar(50) DEFAULT 'code',
  "challenge_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "connected_repos" ADD CONSTRAINT "connected_repos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "scanned_commands" ADD CONSTRAINT "scanned_commands_repo_id_connected_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "connected_repos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "repo_generated_challenges" ADD CONSTRAINT "repo_generated_challenges_repo_id_connected_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "connected_repos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "repo_generated_challenges" ADD CONSTRAINT "repo_generated_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "repo_generated_challenges" ADD CONSTRAINT "repo_generated_challenges_scanned_command_id_scanned_commands_id_fk" FOREIGN KEY ("scanned_command_id") REFERENCES "scanned_commands"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "repo_categories" ADD CONSTRAINT "repo_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "repo_categories" ADD CONSTRAINT "repo_categories_repo_id_connected_repos_id_fk" FOREIGN KEY ("repo_id") REFERENCES "connected_repos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
