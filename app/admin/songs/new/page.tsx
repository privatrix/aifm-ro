import { db } from "@/db";
import { songs } from "@/db/schema";
import { pickFreeFreq } from "@/lib/songs";
import SongForm from "../_components/SongForm";

export const dynamic = "force-dynamic";

export default async function NewSongPage() {
  const existing = await db.select({ freq: songs.freq }).from(songs);
  const suggested = pickFreeFreq(existing.map((r) => r.freq)) ?? "";

  return (
    <div>
      <h1 className="text-xl text-zinc-100 mb-6">New song</h1>
      <SongForm mode="new" defaults={{}} suggestedFreq={suggested} />
    </div>
  );
}
