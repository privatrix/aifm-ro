import { desc } from "drizzle-orm";
import { db } from "@/db";
import { vioLines, vioThoughts } from "@/db/schema";
import VioLinesEditor from "./VioLinesEditor";
import VioThoughtStream from "./VioThoughtStream";

export const dynamic = "force-dynamic";

export default async function VioPage() {
  const lines = await db.select().from(vioLines).orderBy(desc(vioLines.id));
  const thoughts = await db.select().from(vioThoughts).orderBy(desc(vioThoughts.generatedAt)).limit(30);
  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-serif">Vio&apos;s mind</h1>
            <p className="text-[12px] mt-0.5" style={{ color: "rgba(236,231,216,0.5)" }}>
              Live thoughts (LLM-generated) take priority on the public app when fresh. Static lines below are the fallback pool.
            </p>
          </div>
        </div>
        <VioThoughtStream initial={thoughts} />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-serif">Static line pool</h2>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(236,231,216,0.5)" }}>
            The fallback when no fresh LLM thought is available. Tag lines by time-of-day band so morning lines play in the morning.
          </p>
        </div>
        <VioLinesEditor initial={lines} />
      </section>
    </div>
  );
}
