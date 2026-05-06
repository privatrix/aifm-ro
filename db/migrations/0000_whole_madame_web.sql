CREATE SCHEMA "aifm";
--> statement-breakpoint
CREATE TYPE "aifm"."note_status" AS ENUM('pending', 'read', 'archived');--> statement-breakpoint
CREATE TYPE "aifm"."song_status" AS ENUM('active', 'archived', 'draft');--> statement-breakpoint
CREATE TABLE "aifm"."notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_name" text NOT NULL,
	"text" text NOT NULL,
	"status" "aifm"."note_status" DEFAULT 'pending' NOT NULL,
	"reply" text,
	"time_label" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"public" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aifm"."play_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"song_id" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "aifm"."playback_state" (
	"id" integer PRIMARY KEY NOT NULL,
	"current_song_id" integer,
	"started_at" timestamp with time zone,
	"next_song_id" integer
);
--> statement-breakpoint
CREATE TABLE "aifm"."songs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"genre" text NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"bpm" integer DEFAULT 0 NOT NULL,
	"gradient_from" text DEFAULT '#E91E8C' NOT NULL,
	"gradient_to" text DEFAULT '#880E4F' NOT NULL,
	"freq" text NOT NULL,
	"votes" integer DEFAULT 0 NOT NULL,
	"file_key" text,
	"file_url" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "aifm"."song_status" DEFAULT 'draft' NOT NULL,
	"played_count" integer DEFAULT 0 NOT NULL,
	"last_played_at" timestamp with time zone,
	"pinned" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aifm"."vote_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"song_id" integer NOT NULL,
	"fingerprint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "vote_log_song_fp_idx" ON "aifm"."vote_log" USING btree ("song_id","fingerprint");