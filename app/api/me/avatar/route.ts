/**
 * POST /api/me/avatar — accepts a multipart upload (image/jpeg|png|webp,
 * <= 2 MB), stores it in R2 under avatars/<userId>/<random>.<ext>, and sets
 * users.avatar_url to the public URL.
 *
 * We deliberately use direct upload (not presigned) because avatars are
 * small and we want to enforce size + content-type server-side.
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { currentUser, unauthorized } from "@/lib/require-user";
import { putObject, publicUrl } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "Upload invalid." }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Lipsește fișierul." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Imagine prea mare (max 2 MB)." }, { status: 400 });
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json({ ok: false, error: "Format acceptat: JPG, PNG, WEBP." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const key = `avatars/${user.id}/${randomBytes(8).toString("hex")}.${ext}`;
  await putObject(key, buf, file.type);
  const url = publicUrl(key);

  const db = getDb();
  await db.update(users).set({ avatarUrl: url, updatedAt: new Date() }).where(eq(users.id, user.id));

  return NextResponse.json({ ok: true, avatarUrl: url });
}
