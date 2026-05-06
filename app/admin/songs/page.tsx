import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { songs } from "@/db/schema";
import SongsTable from "./_components/SongsTable";

export const dynamic = "force-dynamic";

export default async function SongsPage() {
  const rows = await db.select().from(songs).orderBy(desc(songs.id));
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl text-zinc-100">Songs</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{rows.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/songs/upload"
            className="text-sm border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded hover:bg-zinc-900"
          >
            Bulk upload
          </Link>
          <Link
            href="/admin/songs/new"
            className="text-sm bg-zinc-100 text-zinc-900 px-3 py-1.5 rounded hover:bg-white"
          >
            + New song
          </Link>
        </div>
      </div>
      <SongsTable initialSongs={rows} />
    </div>
  );
}
