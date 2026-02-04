CREATE TABLE "webhooks" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "url" text NOT NULL,
  "secret" text NOT NULL,
  "events" jsonb DEFAULT '["session.completed","achievement.earned"]'::jsonb NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "description" varchar(255),
  "last_delivered_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "webhook_deliveries" (
  "id" serial PRIMARY KEY NOT NULL,
  "webhook_id" integer NOT NULL REFERENCES "webhooks"("id") ON DELETE CASCADE,
  "event" varchar(100) NOT NULL,
  "payload" jsonb NOT NULL,
  "status_code" integer,
  "response_body" text,
  "success" boolean DEFAULT false NOT NULL,
  "attempt_number" integer DEFAULT 1 NOT NULL,
  "delivered_at" timestamp DEFAULT now() NOT NULL
);
