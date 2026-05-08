/**
 * GET   /api/me/settings — current user's settings (creating defaults on read).
 * PATCH /api/me/settings — update notifications / language / theme.
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userSettings } from "@/db/schema";
import { currentUser, unauthorized } from "@/lib/require-user";
import { ensureSettings } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_THEMES = new Set(["system", "light", "dark"]);
const ALLOWED_LANGUAGES = new Set(["ro"]);

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  await ensureSettings(user.id);
  const db = getDb();
  const [s] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .limit(1);

  return NextResponse.json({
    ok: true,
    settings: s ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const b = body as Record<string, unknown>;

  const patch: Partial<{ notifications: boolean; language: string; theme: string }> = {};

  if (typeof b.notifications === "boolean") patch.notifications = b.notifications;
  if (typeof b.language === "string") {
    if (!ALLOWED_LANGUAGES.has(b.language)) {
      return NextResponse.json({ ok: false, error: "Limbă necunoscută." }, { status: 400 });
    }
    patch.language = b.language;
  }
  if (typeof b.theme === "string") {
    if (!ALLOWED_THEMES.has(b.theme)) {
      return NextResponse.json({ ok: false, error: "Temă necunoscută." }, { status: 400 });
    }
    patch.theme = b.theme;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "Nimic de salvat." }, { status: 400 });
  }

  await ensureSettings(user.id);
  const db = getDb();
  await db
    .update(userSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(userSettings.userId, user.id));

  return NextResponse.json({ ok: true });
}
