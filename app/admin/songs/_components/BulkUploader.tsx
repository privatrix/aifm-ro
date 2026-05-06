"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  finalizeUpload,
  getPresignedUrl,
  MAX_BYTES,
  putFileWithProgress,
  validateAudioFile,
} from "./uploadClient";

type Status = "queued" | "uploading" | "processing" | "done" | "error";

type Item = {
  id: string;
  file: File;
  status: Status;
  progress: number;
  error?: string;
  songId?: number;
  duration?: number;
  title?: string;
};

const MAX_CONCURRENCY = 3;

export default function BulkUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function setItem(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function addFiles(fileList: FileList | File[]) {
    const next: Item[] = [];
    for (const f of Array.from(fileList)) {
      const verr = validateAudioFile(f);
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        status: verr ? "error" : "queued",
        progress: 0,
        error: verr ?? undefined,
      });
    }
    setItems((prev) => [...prev, ...next]);
  }

  async function processOne(item: Item) {
    try {
      setItem(item.id, { status: "uploading", progress: 0, error: undefined });
      const { uploadUrl, key } = await getPresignedUrl(item.file);
      await putFileWithProgress(uploadUrl, item.file, (p) => setItem(item.id, { progress: p }));
      setItem(item.id, { status: "processing", progress: 100 });
      const { song } = await finalizeUpload({ key, fileName: item.file.name });
      const s = song as { id: number; durationSeconds: number; title: string };
      setItem(item.id, { status: "done", songId: s.id, duration: s.durationSeconds, title: s.title });
    } catch (e) {
      setItem(item.id, { status: "error", error: (e as Error).message });
    }
  }

  async function startAll() {
    setRunning(true);
    // Snapshot queued ids upfront; process with simple worker pool.
    const queue = items.filter((i) => i.status === "queued").map((i) => i);
    let cursor = 0;
    async function worker() {
      while (cursor < queue.length) {
        const idx = cursor++;
        await processOne(queue[idx]);
      }
    }
    const workers = Array.from({ length: Math.min(MAX_CONCURRENCY, queue.length) }, () => worker());
    await Promise.all(workers);
    setRunning(false);
  }

  function clearDone() {
    setItems((prev) => prev.filter((i) => i.status !== "done"));
  }

  const queued = items.filter((i) => i.status === "queued").length;
  const done = items.filter((i) => i.status === "done").length;
  const errored = items.filter((i) => i.status === "error").length;
  const inFlight = items.some((i) => i.status === "uploading" || i.status === "processing");

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={`border border-dashed rounded p-10 text-center cursor-pointer transition-colors ${
          dragOver ? "border-zinc-400 bg-zinc-900/60" : "border-zinc-800 hover:border-zinc-600"
        }`}
      >
        <p className="text-zinc-300 text-sm">Drop audio files here, or click to browse</p>
        <p className="text-zinc-600 text-xs mt-1">mp3, wav, m4a, aac · ≤ {(MAX_BYTES / 1_000_000) | 0} MB each</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />

      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span>{items.length} files</span>
        <span>·</span>
        <span>{queued} queued</span>
        <span>·</span>
        <span className="text-emerald-400">{done} done</span>
        {errored > 0 && (
          <>
            <span>·</span>
            <span className="text-red-400">{errored} errors</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          {done > 0 && (
            <button onClick={clearDone} className="text-zinc-500 hover:text-zinc-300">
              Clear done
            </button>
          )}
          <button
            disabled={running || inFlight || queued === 0}
            onClick={startAll}
            className="bg-zinc-100 text-zinc-900 px-3 py-1.5 rounded hover:bg-white disabled:opacity-40"
          >
            {running ? "Uploading…" : `Start ${queued > 0 ? `(${queued})` : ""}`}
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="border border-zinc-800 rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-3 py-2 text-left">File</th>
                <th className="px-3 py-2 text-left">Size</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left w-1/3">Progress</th>
                <th className="px-3 py-2 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-zinc-800">
                  <td className="px-3 py-2 text-zinc-100 truncate max-w-[280px]">
                    {it.songId ? (
                      <Link href={`/admin/songs/${it.songId}/edit`} className="hover:underline">
                        {it.title || it.file.name}
                      </Link>
                    ) : (
                      it.file.name
                    )}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{(it.file.size / 1_000_000).toFixed(1)} MB</td>
                  <td className="px-3 py-2">
                    <StatusBadge s={it.status} />
                    {it.status === "error" && it.error && (
                      <div className="text-[10px] text-red-400 mt-0.5 max-w-[260px]">{it.error}</div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-1.5 bg-zinc-900 rounded overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          it.status === "error" ? "bg-red-500" : it.status === "done" ? "bg-emerald-500" : "bg-zinc-300"
                        }`}
                        style={{
                          width:
                            it.status === "done"
                              ? "100%"
                              : it.status === "processing"
                              ? "95%"
                              : it.status === "uploading"
                              ? `${it.progress}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-zinc-500">
                    {it.duration
                      ? `${Math.floor(it.duration / 60)}:${String(it.duration % 60).padStart(2, "0")}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {done > 0 && !inFlight && (
        <div className="text-sm text-zinc-300">
          {done} song{done === 1 ? "" : "s"} uploaded ·{" "}
          <Link href="/admin/songs" className="underline hover:text-white">
            go to songs →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ s }: { s: Status }) {
  const map: Record<Status, string> = {
    queued: "bg-zinc-800 text-zinc-400",
    uploading: "bg-blue-900/40 text-blue-300",
    processing: "bg-amber-900/40 text-amber-300",
    done: "bg-emerald-900/40 text-emerald-300",
    error: "bg-red-900/40 text-red-300",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${map[s]}`}>{s}</span>
  );
}
