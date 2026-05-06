import {
  pgSchema,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// All AI FM tables live in the `aifm` schema so we don't collide with other
// projects sharing this Neon database (e.g. the existing `ieftin` schema).
export const aifm = pgSchema("aifm");

export const songStatus = aifm.enum("song_status", ["active", "archived", "draft"]);
export const noteStatus = aifm.enum("note_status", ["pending", "read", "archived"]);

export const songs = aifm.table("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  genre: text("genre").notNull(),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  bpm: integer("bpm").notNull().default(0),
  gradientFrom: text("gradient_from").notNull().default("#E91E8C"),
  gradientTo: text("gradient_to").notNull().default("#880E4F"),
  freq: text("freq").notNull(),
  votes: integer("votes").notNull().default(0),
  fileKey: text("file_key"),
  fileUrl: text("file_url"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  status: songStatus("status").notNull().default("draft"),
  playedCount: integer("played_count").notNull().default(0),
  lastPlayedAt: timestamp("last_played_at", { withTimezone: true }),
  pinned: boolean("pinned").notNull().default(false),
});

export const notes = aifm.table("notes", {
  id: serial("id").primaryKey(),
  fromName: text("from_name").notNull(),
  text: text("text").notNull(),
  status: noteStatus("status").notNull().default("pending"),
  reply: text("reply"),
  timeLabel: text("time_label").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
  public: boolean("public").notNull().default(false),
});

// Single-row table (id always = 1)
export const playbackState = aifm.table("playback_state", {
  id: integer("id").primaryKey(),
  currentSongId: integer("current_song_id"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  nextSongId: integer("next_song_id"),
});

export const playHistory = aifm.table("play_history", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const voteLog = aifm.table(
  "vote_log",
  {
    id: serial("id").primaryKey(),
    songId: integer("song_id").notNull(),
    fingerprint: text("fingerprint").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    songFp: uniqueIndex("vote_log_song_fp_idx").on(t.songId, t.fingerprint),
  }),
);

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
