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
          <h1 className="text-2xl font-serif">Songs</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(236,231,216,0.5)" }}>{rows.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/songs/upload" className="admin-btn admin-btn-ghost">
            Bulk upload
          </Link>
          <Link href="/admin/songs/new" className="admin-btn admin-btn-primary">
            + New song
          </Link>
        </div>
      </div>
      <SongsTable initialSongs={rows} />
    </div>
  );
}
