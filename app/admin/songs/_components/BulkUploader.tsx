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
import { GENRES } from "@/lib/palettes";

type Status = "queued" | "uploading" | "processing" | "done" | "error";

type Item = {
  id: string;
  file: File;
  status: Status;
  progress: number;
  error?: string;
  songId?: number;
  duration?: number;
  title: string;       // editable, defaults to filename without ext
  genre: string;       // editable, defaults to Ambient
};

const MAX_CONCURRENCY = 3;

function defaultTitle(name: string): string {
  const dot = name.lastIndexOf(".");
  return (dot > 0 ? name.slice(0, dot) : name).replace(/[_-]+/g, " ").trim();
}

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
        title: defaultTitle(f.name),
        genre: "Ambient",
      });
    }
    setItems((prev) => [...prev, ...next]);
  }

  function applyGenreToAll(g: string) {
    setItems((prev) => prev.map((it) => (it.status === "queued" ? { ...it, genre: g } : it)));
  }

  async function processOne(item: Item) {
    try {
      // Snapshot the current title/genre at start so edits during run don't matter.
      const currentItem = (items.find((i) => i.id === item.id) ?? item);
      const title = currentItem.title.trim() || defaultTitle(item.file.name);
      const genre = currentItem.genre || "Ambient";
      setItem(item.id, { status: "uploading", progress: 0, error: undefined });
      const { uploadUrl, key } = await getPresignedUrl(item.file);
      await putFileWithProgress(uploadUrl, item.file, (p) => setItem(item.id, { progress: p }));
      setItem(item.id, { status: "processing", progress: 100 });
      const { song } = await finalizeUpload({ key, fileName: item.file.name, title, genre });
      const s = song as { id: number; durationSeconds: number; title: string };
      setItem(item.id, {
        status: "done",
        songId: s.id,
        duration: s.durationSeconds,
        title: s.title,
      });
    } catch (e) {
      setItem(item.id, { status: "error", error: (e as Error).message });
    }
  }

  async function startAll() {
    setRunning(true);
    // Read freshest titles/genres at run-time via setItems closure.
    const queue = items.filter((i) => i.status === "queued");
    let cursor = 0;
    async function worker() {
      while (cursor < queue.length) {
        const idx = cursor++;
        // Re-read latest item state by id
        const fresh = (await new Promise<Item | undefined>((resolve) => {
          setItems((prev) => {
            resolve(prev.find((p) => p.id === queue[idx].id));
            return prev;
          });
        })) ?? queue[idx];
        await processOne(fresh);
      }
    }
    const workers = Array.from({ length: Math.min(MAX_CONCURRENCY, queue.length) }, () => worker());
    await Promise.all(workers);
    setRunning(false);
  }

  async function retryErrored() {
    const erroredItems = items.filter((i) => i.status === "error");
    if (erroredItems.length === 0) return;
    setItems((prev) =>
      prev.map((it) =>
        it.status === "error" ? { ...it, status: "queued", error: undefined, progress: 0 } : it,
      ),
    );
    // small tick so React picks up the state before processing starts
    setTimeout(() => void startAll(), 50);
  }

  function clearDone() {
    setItems((prev) => prev.filter((i) => i.status !== "done"));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const queued = items.filter((i) => i.status === "queued").length;
  const done = items.filter((i) => i.status === "done").length;
  const errored = items.filter((i) => i.status === "error").length;
  const inFlight = items.some((i) => i.status === "uploading" || i.status === "processing");

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        data-active={dragOver ? "true" : undefined}
        className="admin-dropzone cursor-pointer"
      >
        <p className="text-sm" style={{ color: "rgba(236,231,216,0.85)" }}>
          🎵 Drop audio files here, or click to browse
        </p>
        <p className="text-[11px] mt-1" style={{ color: "rgba(236,231,216,0.45)" }}>
          mp3 · wav · m4a · aac · ≤ {(MAX_BYTES / 1_000_000) | 0} MB each
        </p>
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

      {items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span style={{ color: "rgba(236,231,216,0.7)" }}>{items.length} files</span>
            <span style={{ color: "rgba(236,231,216,0.3)" }}>·</span>
            <span style={{ color: "rgba(236,231,216,0.7)" }}>{queued} queued</span>
            {done > 0 && (<><span style={{ color: "rgba(236,231,216,0.3)" }}>·</span><span style={{ color: "#84d488" }}>{done} done</span></>)}
            {errored > 0 && (<><span style={{ color: "rgba(236,231,216,0.3)" }}>·</span><span style={{ color: "#ff7370" }}>{errored} errors</span></>)}

            {/* Bulk genre apply */}
            {queued > 0 && (
              <div className="flex items-center gap-2 ml-2">
                <span className="mono text-[10px] uppercase tracking-widest" style={{ color: "rgba(236,231,216,0.5)" }}>
                  apply genre to all queued:
                </span>
                <select
                  onChange={(e) => { if (e.target.value) applyGenreToAll(e.target.value); e.currentTarget.value = ""; }}
                  className="admin-select !w-auto !py-1 !text-[11px]"
                  defaultValue=""
                >
                  <option value="">— pick —</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              {errored > 0 && (
                <button onClick={retryErrored} className="admin-btn admin-btn-ghost !py-1 !px-3 !text-xs">
                  Retry errored
                </button>
              )}
              {done > 0 && (
                <button onClick={clearDone} className="admin-btn admin-btn-ghost !py-1 !px-3 !text-xs">
                  Clear done
                </button>
              )}
              <button
                disabled={running || inFlight || queued === 0}
                onClick={startAll}
                className="admin-btn admin-btn-primary !py-1 !px-3 !text-xs"
              >
                {running ? "Uploading…" : `Start${queued > 0 ? ` (${queued})` : ""}`}
              </button>
            </div>
          </div>

          <div className="admin-card overflow-hidden">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Genre</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th className="w-1/4">Progress</th>
                  <th>Duration</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const editable = it.status === "queued" || it.status === "error";
                  return (
                    <tr key={it.id}>
                      <td style={{ color: "#f5efe2" }}>
                        {it.songId ? (
                          <Link href={`/admin/songs/${it.songId}/edit`} className="admin-link">
                            {it.title || it.file.name}
                          </Link>
                        ) : editable ? (
                          <input
                            value={it.title}
                            onChange={(e) => setItem(it.id, { title: e.target.value })}
                            placeholder={defaultTitle(it.file.name)}
                            className="admin-input !py-1 !text-[12px] !w-full max-w-[260px]"
                          />
                        ) : (
                          <span>{it.title || it.file.name}</span>
                        )}
                        <div className="mono text-[10px] mt-0.5 truncate max-w-[260px]" style={{ color: "rgba(236,231,216,0.35)" }}>
                          {it.file.name}
                        </div>
                      </td>
                      <td>
                        {editable && !it.songId ? (
                          <select
                            value={it.genre}
                            onChange={(e) => setItem(it.id, { genre: e.target.value })}
                            className="admin-select !py-1 !text-[12px]"
                          >
                            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                          </select>
                        ) : (
                          <span>{it.genre}</span>
                        )}
                      </td>
                      <td className="mono" style={{ color: "rgba(236,231,216,0.55)" }}>
                        {(it.file.size / 1_000_000).toFixed(1)} MB
                      </td>
                      <td>
                        <StatusBadge s={it.status} />
                        {it.status === "error" && it.error && (
                          <div className="text-[10px] mt-0.5 max-w-[260px]" style={{ color: "#ff7370" }}>
                            {it.error}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="admin-progress">
                          <span
                            style={{
                              width:
                                it.status === "done"
                                  ? "100%"
                                  : it.status === "processing"
                                  ? "95%"
                                  : it.status === "uploading"
                                  ? `${it.progress}%`
                                  : "0%",
                              background: it.status === "error"
                                ? "linear-gradient(90deg, #E53935, #C62828)"
                                : it.status === "done"
                                ? "linear-gradient(90deg, #66BB6A, #43A047)"
                                : undefined,
                            }}
                          />
                        </div>
                      </td>
                      <td className="mono" style={{ color: "rgba(236,231,216,0.55)" }}>
                        {it.duration
                          ? `${Math.floor(it.duration / 60)}:${String(it.duration % 60).padStart(2, "0")}`
                          : "—"}
                      </td>
                      <td>
                        {editable && (
                          <button
                            onClick={() => removeItem(it.id)}
                            className="text-[12px]"
                            style={{ color: "rgba(236,231,216,0.4)" }}
                            title="Remove"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {done > 0 && !inFlight && (
        <div className="text-sm" style={{ color: "rgba(236,231,216,0.85)" }}>
          {done} song{done === 1 ? "" : "s"} uploaded ·{" "}
          <Link href="/admin/songs" className="admin-link">
            go to songs →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ s }: { s: Status }) {
  const styles: Record<Status, { bg: string; color: string; border: string }> = {
    queued:     { bg: "rgba(255,255,255,0.05)", color: "rgba(236,231,216,0.65)", border: "rgba(255,255,255,0.10)" },
    uploading:  { bg: "rgba(33,150,243,0.15)", color: "#90CAF9", border: "rgba(33,150,243,0.30)" },
    processing: { bg: "rgba(255,167,38,0.15)", color: "#ffb86b", border: "rgba(255,167,38,0.30)" },
    done:       { bg: "rgba(76,175,80,0.15)", color: "#84d488", border: "rgba(76,175,80,0.30)" },
    error:      { bg: "rgba(229,57,53,0.15)", color: "#ff7370", border: "rgba(229,57,53,0.30)" },
  };
  const st = styles[s];
  return (
    <span
      className="admin-pill"
      style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
    >
      {s}
    </span>
  );
}
