"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  finalizeUpload,
  getPresignedUrl,
  MAX_BYTES,
  putFileWithProgress,
  validateAudioFile,
} from "./uploadClient";

type Props = {
  // If songId is provided we attach the file to that song; otherwise we create a new song.
  songId?: number;
  initialFileUrl?: string | null;
  initialFileKey?: string | null;
  initialDuration?: number;
};

export default function SongFileUploader({
  songId,
  initialFileUrl = null,
  initialFileKey = null,
  initialDuration = 0,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(initialFileUrl);
  const [fileKey, setFileKey] = useState<string | null>(initialFileKey);
  const [duration, setDuration] = useState<number>(initialDuration);
  const [progress, setProgress] = useState<number>(0);
  const [phase, setPhase] = useState<"idle" | "presign" | "uploading" | "processing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    const verr = validateAudioFile(file);
    if (verr) {
      setError(verr);
      setPhase("error");
      return;
    }
    try {
      setPhase("presign");
      setProgress(0);
      const { uploadUrl, key, publicUrl } = await getPresignedUrl(file);
      setPhase("uploading");
      await putFileWithProgress(uploadUrl, file, (p) => setProgress(p));
      setPhase("processing");
      const { song } = await finalizeUpload({ id: songId, key, fileName: file.name });
      const s = song as { id: number; fileUrl: string | null; fileKey: string | null; durationSeconds: number };

      if (!songId) {
        // Create-on-upload flow: jump straight to the new song's edit page so user can rename.
        router.push(`/admin/songs/${s.id}/edit`);
        return;
      }
      setFileUrl(s.fileUrl ?? publicUrl);
      setFileKey(s.fileKey ?? key);
      setDuration(s.durationSeconds ?? 0);
      setPhase("done");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  }

  return (
    <div className="admin-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="admin-label !mb-0">Audio file</h2>
        <span className="text-[10px] mono" style={{ color: "rgba(236,231,216,0.4)" }}>
          max {(MAX_BYTES / 1_000_000) | 0} MB
        </span>
      </div>

      {fileUrl ? (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <audio controls src={fileUrl} className="h-8" />
          <span style={{ color: "rgba(236,231,216,0.6)" }}>
            {duration ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}` : "?"}
          </span>
          <code className="text-[10px] mono truncate max-w-[260px]" style={{ color: "rgba(236,231,216,0.4)" }}>
            {fileKey}
          </code>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="ml-auto admin-link text-xs"
          >
            Replace
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          data-active={dragOver ? "true" : undefined}
          className="admin-dropzone cursor-pointer"
        >
          <p className="text-sm" style={{ color: "rgba(236,231,216,0.85)" }}>
            🎵 Drop audio file here, or click to browse
          </p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(236,231,216,0.45)" }}>
            mp3 · wav · m4a · aac · ≤ 30 MB
          </p>
          {!songId && (
            <p className="text-[10px] mt-2 mono uppercase tracking-widest" style={{ color: "rgba(244,143,177,0.7)" }}>
              auto-creates a new song with random gradient
            </p>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.currentTarget.value = "";
        }}
      />

      {phase !== "idle" && phase !== "done" && (
        <div className="space-y-1.5">
          <div className="text-[11px] flex justify-between" style={{ color: "rgba(236,231,216,0.7)" }}>
            <span>
              {phase === "presign" && "Requesting upload URL…"}
              {phase === "uploading" && `Uploading… ${progress}%`}
              {phase === "processing" && "Extracting metadata…"}
              {phase === "error" && "Error"}
            </span>
          </div>
          <div className="admin-progress">
            <span
              style={{
                width:
                  phase === "uploading"
                    ? `${progress}%`
                    : phase === "presign"
                    ? "10%"
                    : phase === "processing"
                    ? "95%"
                    : "0%",
              }}
            />
          </div>
        </div>
      )}

      {phase === "done" && (
        <p className="text-xs" style={{ color: "#84d488" }}>
          ✓ Uploaded
        </p>
      )}
      {error && (
        <p className="text-xs" style={{ color: "#ff7370" }}>
          {error}
        </p>
      )}
    </div>
  );
}
