-- Auth + profile data model.
--
-- Adds: users, sessions, user_settings, user_favorites, user_plays,
-- rate_limit_log. Extends notes and vote_log with optional user_id so
-- existing anonymous flows continue to work.
--
-- All tables live in the `aifm` schema. No FKs across schemas (we keep this
-- simple; the application enforces referential integrity).

CREATE TABLE IF NOT EXISTS "aifm"."users" (
  "id"               serial PRIMARY KEY,
  "email"            text NOT NULL,
  "password_hash"    text NOT NULL,
  "display_name"     text NOT NULL,
  "handle"           text NOT NULL,
  "bio"              text NOT NULL DEFAULT '',
  "city"             text NOT NULL DEFAULT '',
  "avatar_url"       text,
  "email_verified_at" timestamp with time zone,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx"  ON "aifm"."users" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_handle_idx" ON "aifm"."users" ("handle");

CREATE TABLE IF NOT EXISTS "aifm"."user_settings" (
  "user_id"       integer PRIMARY KEY,
  "notifications" boolean NOT NULL DEFAULT true,
  "language"      text NOT NULL DEFAULT 'ro',
  "theme"         text NOT NULL DEFAULT 'system',
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "aifm"."sessions" (
  "id"            text PRIMARY KEY,
  "user_id"       integer NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at"    timestamp with time zone NOT NULL,
  "last_seen_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "user_agent"    text,
  "ip"            text
);

CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "aifm"."sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "sessions_exp_idx"  ON "aifm"."sessions" ("expires_at");

CREATE TABLE IF NOT EXISTS "aifm"."user_favorites" (
  "user_id"     integer NOT NULL,
  "song_id"     integer NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "song_id")
);

CREATE INDEX IF NOT EXISTS "user_favorites_song_idx" ON "aifm"."user_favorites" ("song_id");

CREATE TABLE IF NOT EXISTS "aifm"."user_plays" (
  "id"          serial PRIMARY KEY,
  "user_id"     integer NOT NULL,
  "song_id"     integer NOT NULL,
  "started_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "seconds"     integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "user_plays_user_time_idx" ON "aifm"."user_plays" ("user_id", "started_at");

CREATE TABLE IF NOT EXISTS "aifm"."rate_limit_log" (
  "id"          serial PRIMARY KEY,
  "action"      text NOT NULL,
  "key_hash"    text NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "rate_limit_action_key_idx"
  ON "aifm"."rate_limit_log" ("action", "key_hash", "created_at");

-- Optional ownership on existing tables. These columns are NULL for
-- pre-existing rows; signed-in users get them populated going forward.
ALTER TABLE "aifm"."notes"    ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "aifm"."vote_log" ADD COLUMN IF NOT EXISTS "user_id" integer;
