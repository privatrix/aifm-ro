import {
  pgSchema,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
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
  // Optional: when the note was sent by a logged-in user. Null = anonymous.
  userId: integer("user_id"),
});

// Single-row table (id always = 1)
export const playbackState = aifm.table("playback_state", {
  id: integer("id").primaryKey(),
  currentSongId: integer("current_song_id"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  nextSongId: integer("next_song_id"),
  /** Last time the live encoder pinged us. Null = no live broadcast ever ran. */
  lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }),
});

export const playHistory = aifm.table("play_history", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const vioLines = aifm.table("vio_lines", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  // Optional time-of-day band: "morning" | "day" | "evening" | "night" | null (any time).
  band: text("band"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vioThoughts = aifm.table("vio_thoughts", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  songId: integer("song_id"),
  band: text("band"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  approved: boolean("approved").notNull().default(true),
  source: text("source").notNull().default("llm"),
});

export const voteLog = aifm.table(
  "vote_log",
  {
    id: serial("id").primaryKey(),
    songId: integer("song_id").notNull(),
    fingerprint: text("fingerprint").notNull(),
    // Optional: when a logged-in user voted. Anonymous votes still rely on
    // (songId, fingerprint) for deduplication.
    userId: integer("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    songFp: uniqueIndex("vote_log_song_fp_idx").on(t.songId, t.fingerprint),
  }),
);

// ---------------------------------------------------------------------------
// Users + sessions + profile data.
// ---------------------------------------------------------------------------

export const users = aifm.table(
  "users",
  {
    id: serial("id").primaryKey(),
    // Lower-cased email used for login (we normalize at the API boundary).
    email: text("email").notNull(),
    // Argon2id hash. ~$argon2id$v=19$m=...$...
    passwordHash: text("password_hash").notNull(),
    // Public display name. Free-form, 1-40 chars.
    displayName: text("display_name").notNull(),
    // Lower-cased handle (a-z, 0-9, _) used in @mentions and URLs.
    handle: text("handle").notNull(),
    bio: text("bio").notNull().default(""),
    city: text("city").notNull().default(""),
    avatarUrl: text("avatar_url"),
    // Reserved for future email-verification flow. Currently always false.
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
    handleIdx: uniqueIndex("users_handle_idx").on(t.handle),
  }),
);

export const userSettings = aifm.table("user_settings", {
  // 1:1 with users.
  userId: integer("user_id").primaryKey(),
  notifications: boolean("notifications").notNull().default(true),
  language: text("language").notNull().default("ro"),
  // "system" | "light" | "dark"
  theme: text("theme").notNull().default("system"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = aifm.table(
  "sessions",
  {
    // 64-char hex token, also used as the session cookie value.
    id: text("id").primaryKey(),
    userId: integer("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
    ip: text("ip"),
  },
  (t) => ({
    userIdx: index("sessions_user_idx").on(t.userId),
    expIdx: index("sessions_exp_idx").on(t.expiresAt),
  }),
);

export const userFavorites = aifm.table(
  "user_favorites",
  {
    userId: integer("user_id").notNull(),
    songId: integer("song_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.songId] }),
    songIdx: index("user_favorites_song_idx").on(t.songId),
  }),
);

// Per-user listening log. Anonymous listeners do not appear here — only the
// aggregate playHistory above is updated for them.
export const userPlays = aifm.table(
  "user_plays",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    songId: integer("song_id").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    // Approximate seconds heard (the client pings periodically).
    seconds: integer("seconds").notNull().default(0),
  },
  (t) => ({
    userTimeIdx: index("user_plays_user_time_idx").on(t.userId, t.startedAt),
  }),
);

// Rate-limit log. (action, key) is e.g. ("signin", "<ip>"). We expire rows by
// time bucket and let the API count entries in a window.
export const rateLimitLog = aifm.table(
  "rate_limit_log",
  {
    id: serial("id").primaryKey(),
    action: text("action").notNull(),
    keyHash: text("key_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    actionKeyIdx: index("rate_limit_action_key_idx").on(t.action, t.keyHash, t.createdAt),
  }),
);

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type VioLine = typeof vioLines.$inferSelect;
export type NewVioLine = typeof vioLines.$inferInsert;
export type VioThought = typeof vioThoughts.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type UserFavorite = typeof userFavorites.$inferSelect;
