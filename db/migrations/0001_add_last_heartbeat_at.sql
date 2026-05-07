-- Track when the live encoder last pinged the heartbeat endpoint. Used by
-- /api/now to decide if the broadcast is "live" or stale.
ALTER TABLE "aifm"."playback_state" ADD COLUMN IF NOT EXISTS "last_heartbeat_at" timestamp with time zone;
