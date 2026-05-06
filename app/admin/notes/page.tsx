import { desc } from "drizzle-orm";
import { db } from "@/db";
import { notes } from "@/db/schema";
import NotesInbox from "./NotesInbox";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const rows = await db.select().from(notes).orderBy(desc(notes.createdAt)).limit(200);
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif">Notes</h1>
        <p className="text-[12px] mt-0.5" style={{ color: "rgba(236,231,216,0.5)" }}>
          Listener bilete. Mark as read with a reply, then publish to make them appear on the public Bilete tab.
        </p>
      </div>
      <NotesInbox initial={rows} />
    </div>
  );
}
