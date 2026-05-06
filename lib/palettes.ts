// Shared palettes used by both the public app and the admin.
// Keep these in sync with the brand identity — pink/purple/red/cool families.

export const GENRES = [
  "Manele",
  "Etno",
  "Folclor",
  "Muzică Populară",
  "Pop Românesc",
  "Rock Românesc",
  "Hip-Hop / Trap",
  "Dance / Club",
  "Lo-fi / Chill",
  "Ambient",
  "Lăutărești",
  "Indie",
] as const;

export type Genre = (typeof GENRES)[number];

export const GRADIENTS: [string, string][] = [
  ["#E91E8C", "#C2185B"], // hot pink
  ["#8E24AA", "#6A1B9A"], // violet
  ["#E53935", "#C62828"], // red
  ["#F57C00", "#E64A19"], // orange
  ["#7B1FA2", "#4A148C"], // deep purple
  ["#1565C0", "#0D47A1"], // blue
  ["#AD1457", "#880E4F"], // wine
  ["#D81B60", "#AD1457"], // rose
  ["#6A1B9A", "#4A148C"], // amethyst
  ["#E91E8C", "#880E4F"], // magenta-wine
  ["#C2185B", "#880E4F"], // crimson
  ["#BF360C", "#E64A19"], // rust
  ["#1565C0", "#1A237E"], // night blue
  ["#4A148C", "#AD1457"], // mauve-wine
  ["#5E35B1", "#E91E8C"], // electric purple-pink
  ["#00695C", "#006064"], // teal
];

export function pickRandomGradient(): [string, string] {
  return GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
}

// Best-effort mapping from old English genre tags (used in seed data) to the
// canonical Romanian list. Used by the seed and one-shot migration.
export const GENRE_MIGRATION_MAP: Record<string, Genre> = {
  Ambient: "Ambient",
  "Lo-fi": "Lo-fi / Chill",
  Electronic: "Dance / Club",
  Jazz: "Lăutărești",
  Indie: "Indie",
  Synthwave: "Dance / Club",
  Pop: "Pop Românesc",
  Folk: "Folclor",
};
