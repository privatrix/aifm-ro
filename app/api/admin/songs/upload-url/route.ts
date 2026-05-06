import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { presignUpload, publicUrl } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 30_000_000;

const ALLOWED_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/aac",
  "audio/x-m4a",
  "audio/m4a",
  "audio/ogg",
  "audio/flac",
  "audio/webm",
]);

function slug(input: string): string {
  const dot = input.lastIndexOf(".");
  const base = dot > 0 ? input.slice(0, dot) : input;
  const ext = dot > 0 ? input.slice(dot + 1) : "";
  const safeBase =
    base
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "track";
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6);
  return safeExt ? `${safeBase}.${safeExt}` : safeBase;
}

const Body = z.object({
  fileName: z.string().min(1).max(300),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().nonnegative(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation", issues: parsed.error.issues }, { status: 400 });
  }
  const { fileName, contentType, sizeBytes } = parsed.data;

  if (sizeBytes > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `file too large (max ${MAX_BYTES} bytes)` },
      { status: 413 },
    );
  }
  const ct = contentType.toLowerCase();
  if (!(ct.startsWith("audio/") || ALLOWED_TYPES.has(ct))) {
    return NextResponse.json({ ok: false, error: "unsupported content type" }, { status: 415 });
  }

  const key = `tracks/${nanoid(12)}-${slug(fileName)}`;
  try {
    const uploadUrl = await presignUpload(key, contentType);
    return NextResponse.json({
      ok: true,
      uploadUrl,
      key,
      publicUrl: publicUrl(key),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
