-- OIDC Provider tables for OpenID Connect support

CREATE TABLE IF NOT EXISTS "oidc_clients" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "client_id" varchar(64) NOT NULL UNIQUE,
  "client_secret_hash" text NOT NULL,
  "name" varchar(255) NOT NULL,
  "redirect_uris" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "post_logout_redirect_uris" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "scopes" jsonb NOT NULL DEFAULT '["openid","profile","email"]'::jsonb,
  "response_types" jsonb NOT NULL DEFAULT '["code"]'::jsonb,
  "grant_types" jsonb NOT NULL DEFAULT '["authorization_code"]'::jsonb,
  "token_endpoint_auth_method" varchar(50) NOT NULL DEFAULT 'client_secret_post',
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oidc_authorization_codes" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" varchar(128) NOT NULL UNIQUE,
  "client_id" integer NOT NULL REFERENCES "oidc_clients"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "redirect_uri" text NOT NULL,
  "scopes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "nonce" varchar(256),
  "code_challenge" varchar(128),
  "code_challenge_method" varchar(10),
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oidc_access_tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "client_id" integer NOT NULL REFERENCES "oidc_clients"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "scopes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oidc_refresh_tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "client_id" integer NOT NULL REFERENCES "oidc_clients"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "scopes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "oidc_clients_user_id_idx" ON "oidc_clients" ("user_id");
CREATE INDEX IF NOT EXISTS "oidc_auth_codes_client_id_idx" ON "oidc_authorization_codes" ("client_id");
CREATE INDEX IF NOT EXISTS "oidc_auth_codes_user_id_idx" ON "oidc_authorization_codes" ("user_id");
CREATE INDEX IF NOT EXISTS "oidc_access_tokens_client_id_idx" ON "oidc_access_tokens" ("client_id");
CREATE INDEX IF NOT EXISTS "oidc_access_tokens_user_id_idx" ON "oidc_access_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "oidc_refresh_tokens_client_id_idx" ON "oidc_refresh_tokens" ("client_id");
CREATE INDEX IF NOT EXISTS "oidc_refresh_tokens_user_id_idx" ON "oidc_refresh_tokens" ("user_id");
