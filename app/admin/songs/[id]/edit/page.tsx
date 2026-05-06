import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { songs } from "@/db/schema";
import SongForm from "../../_components/SongForm";
import type { Genre } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EditSongPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [row] = await db.select().from(songs).where(eq(songs.id, id));
  if (!row) notFound();

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-xl text-zinc-100">Edit: {row.title}</h1>
        <span className="text-xs text-zinc-500">id #{row.id}</span>
      </div>
      <SongForm
        mode="edit"
        songId={row.id}
        defaults={{
          title: row.title,
          genre: row.genre as Genre,
          freq: row.freq,
          bpm: row.bpm,
          durationSeconds: row.durationSeconds,
          gradientFrom: row.gradientFrom,
          gradientTo: row.gradientTo,
          pinned: row.pinned,
          status: row.status,
        }}
      />
    </div>
  );
}
