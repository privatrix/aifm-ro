import { z } from "zod";
import { GENRES as PALETTE_GENRES } from "./palettes";

export const GENRES = PALETTE_GENRES;

export const STATUSES = ["draft", "active", "archived"] as const;

export const SongCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  genre: z.enum(GENRES as unknown as [string, ...string[]]),
  freq: z
    .string()
    .trim()
    .regex(/^\d{2,3}(\.\d)?$/, "freq like 88.3"),
  bpm: z.number().int().min(0).max(400),
  durationSeconds: z.number().int().min(0).max(60 * 60 * 4),
  pinned: z.boolean(),
  status: z.enum(STATUSES),
});

export const SongUpdateSchema = SongCreateSchema.partial().extend({
  regenerateGradient: z.boolean().optional(),
});

export type SongCreateInput = z.infer<typeof SongCreateSchema>;
export type SongUpdateInput = z.infer<typeof SongUpdateSchema>;

/** FM band 88.0–107.9 in 0.4 increments. Returns first unused slot, else null. */
export function pickFreeFreq(taken: string[]): string | null {
  const used = new Set(taken.map((s) => s.trim()));
  for (let v = 880; v <= 1079; v += 4) {
    const f = (v / 10).toFixed(1);
    if (!used.has(f)) return f;
  }
  return null;
}
