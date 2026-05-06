import { db } from "@/db";
import { songs } from "@/db/schema";
import { pickFreeFreq } from "@/lib/songs";
import SongForm from "../_components/SongForm";
import SongFileUploader from "../_components/SongFileUploader";

export const dynamic = "force-dynamic";

export default async function NewSongPage() {
  const existing = await db.select({ freq: songs.freq }).from(songs);
  const suggested = pickFreeFreq(existing.map((r) => r.freq)) ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif">New song</h1>
        <p className="text-[12px] mt-0.5" style={{ color: "rgba(236,231,216,0.5)" }}>
          Drop a file to auto-create with random gradient, or fill the form below for a placeholder draft.
        </p>
      </div>

      <SongFileUploader />

      <div className="flex items-center gap-3">
        <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <span className="mono text-[10px] uppercase tracking-widest" style={{ color: "rgba(236,231,216,0.4)" }}>
          or create draft manually
        </span>
        <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      <SongForm mode="new" defaults={{}} suggestedFreq={suggested} />
    </div>
  );
}
