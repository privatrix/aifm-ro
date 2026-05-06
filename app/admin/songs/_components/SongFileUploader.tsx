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
  songId: number;
  initialFileUrl: string | null;
  initialFileKey: string | null;
  initialDuration: number;
};

export default function SongFileUploader({ songId, initialFileUrl, initialFileKey, initialDuration }: Props) {
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
      const s = song as { fileUrl: string | null; fileKey: string | null; durationSeconds: number };
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
    <div className="border border-zinc-800 rounded p-4 space-y-3 bg-zinc-950/40">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-wider text-zinc-400">Audio file</h2>
        <span className="text-[10px] text-zinc-600">max {(MAX_BYTES / 1_000_000) | 0} MB</span>
      </div>

      {fileUrl ? (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <audio controls src={fileUrl} className="h-8" />
          <span className="text-zinc-500">
            {duration ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}` : "?"}
          </span>
          <code className="text-[10px] text-zinc-600 truncate max-w-[260px]">{fileKey}</code>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="ml-auto text-zinc-300 hover:text-white text-xs underline-offset-2 hover:underline"
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
          className={`border border-dashed rounded p-6 text-center cursor-pointer text-xs transition-colors ${
            dragOver ? "border-zinc-400 bg-zinc-900/60" : "border-zinc-800 hover:border-zinc-600"
          }`}
        >
          <p className="text-zinc-300">Drop audio file here, or click to browse</p>
          <p className="text-zinc-600 mt-1">mp3, wav, m4a, aac · ≤ 30 MB</p>
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
        <div className="space-y-1">
          <div className="text-[11px] text-zinc-400 flex justify-between">
            <span>
              {phase === "presign" && "Requesting upload URL…"}
              {phase === "uploading" && `Uploading… ${progress}%`}
              {phase === "processing" && "Extracting metadata…"}
              {phase === "error" && "Error"}
            </span>
          </div>
          <div className="h-1.5 bg-zinc-900 rounded overflow-hidden">
            <div
              className="h-full bg-zinc-300 transition-all"
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

      {phase === "done" && <p className="text-xs text-emerald-400">Uploaded ✓</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
