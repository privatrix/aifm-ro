import { desc } from "drizzle-orm";
import { db } from "@/db";
import { vioLines } from "@/db/schema";
import VioLinesEditor from "./VioLinesEditor";

export const dynamic = "force-dynamic";

export default async function VioPage() {
  const rows = await db.select().from(vioLines).orderBy(desc(vioLines.id));
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif">Vio&apos;s lines</h1>
        <p className="text-[12px] mt-0.5" style={{ color: "rgba(236,231,216,0.5)" }}>
          The host&apos;s spoken pool. Each line can be tagged to a time-of-day band so morning lines play in the morning, etc. Empty band = anytime.
        </p>
      </div>
      <VioLinesEditor initial={rows} />
    </div>
  );
}
