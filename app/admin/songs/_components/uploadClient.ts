"use client";

export const MAX_BYTES = 30_000_000;

const ALLOWED_PREFIX = "audio/";
const ALLOWED_EXTRA = new Set([
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

export function validateAudioFile(file: File): string | null {
  if (file.size > MAX_BYTES) return `Too large (max ${(MAX_BYTES / 1_000_000) | 0} MB)`;
  const t = (file.type || "").toLowerCase();
  if (t && !(t.startsWith(ALLOWED_PREFIX) || ALLOWED_EXTRA.has(t))) {
    return `Unsupported type: ${file.type}`;
  }
  return null;
}

export async function getPresignedUrl(file: File): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const r = await fetch("/api/admin/songs/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    }),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "presign failed");
  return { uploadUrl: j.uploadUrl, key: j.key, publicUrl: j.publicUrl };
}

export function putFileWithProgress(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onerror = () => reject(new Error("network error"));
    xhr.onabort = () => reject(new Error("aborted"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`upload http ${xhr.status}`));
    };
    xhr.send(file);
  });
}

export async function finalizeUpload(opts: {
  id?: number;
  key: string;
  fileName: string;
  title?: string;
  genre?: string;
}): Promise<{ song: unknown }> {
  const r = await fetch("/api/admin/songs/finalize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(opts),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "finalize failed");
  return { song: j.song };
}
