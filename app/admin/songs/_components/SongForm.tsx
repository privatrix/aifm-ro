"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { SongCreateSchema, GENRES, STATUSES, type SongCreateInput } from "@/lib/songs";
import Link from "next/link";

type Props = {
  mode: "new" | "edit";
  songId?: number;
  defaults: Partial<SongCreateInput> & { gradientFrom?: string; gradientTo?: string };
  suggestedFreq?: string;
};

export default function SongForm({ mode, songId, defaults, suggestedFreq }: Props) {
  const router = useRouter();
  const [grad, setGrad] = useState({
    from: defaults.gradientFrom ?? "#E91E8C",
    to: defaults.gradientTo ?? "#C2185B",
  });
  const [reRolling, setReRolling] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SongCreateInput>({
    resolver: zodResolver(SongCreateSchema),
    defaultValues: {
      title: defaults.title ?? "",
      genre: defaults.genre ?? "Ambient",
      freq: defaults.freq ?? suggestedFreq ?? "",
      bpm: defaults.bpm ?? 0,
      durationSeconds: defaults.durationSeconds ?? 0,
      pinned: defaults.pinned ?? false,
      status: defaults.status ?? "draft",
    },
  });

  async function onSubmit(values: SongCreateInput) {
    const url = mode === "new" ? "/api/admin/songs" : `/api/admin/songs/${songId}`;
    const method = mode === "new" ? "POST" : "PATCH";
    const r = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const j = await r.json();
    if (!j.ok) {
      alert("Save failed: " + (j.error || "validation"));
      return;
    }
    router.push("/admin/songs");
    router.refresh();
  }

  async function rerollGradient() {
    if (!songId) return;
    setReRolling(true);
    const r = await fetch(`/api/admin/songs/${songId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ regenerateGradient: true }),
    });
    const j = await r.json();
    setReRolling(false);
    if (j.ok && j.song) {
      setGrad({ from: j.song.gradientFrom, to: j.song.gradientTo });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <Field label="Title" error={errors.title?.message}>
        <input {...register("title")} className="admin-input" />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Genre" error={errors.genre?.message}>
          <select {...register("genre")} className="admin-select">
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Frequency"
          hint={suggestedFreq && mode === "new" ? `next free: ${suggestedFreq}` : undefined}
          error={errors.freq?.message}
        >
          <input {...register("freq")} placeholder="88.3" className="admin-input" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="BPM (optional)" error={errors.bpm?.message}>
          <input
            type="number"
            {...register("bpm", { valueAsNumber: true })}
            className="admin-input"
          />
        </Field>
        <Field label="Duration seconds (optional)" error={errors.durationSeconds?.message}>
          <input
            type="number"
            {...register("durationSeconds", { valueAsNumber: true })}
            className="admin-input"
          />
        </Field>
      </div>

      {/* Gradient — read-only, auto-assigned. Re-roll available in edit mode. */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="admin-label">Gradient (auto)</span>
          {mode === "edit" && (
            <button
              type="button"
              onClick={rerollGradient}
              disabled={reRolling}
              className="text-[11px] mono uppercase tracking-widest"
              style={{ color: "rgba(244,143,177,0.85)" }}
            >
              {reRolling ? "..." : "🎲 Re-roll"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-10 rounded-lg shrink-0"
            style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`, border: "1px solid rgba(255,255,255,0.08)" }}
          />
          <code className="mono text-[11px]" style={{ color: "rgba(236,231,216,0.5)" }}>
            {grad.from} → {grad.to}
          </code>
          <span className="ml-auto mono text-[10px]" style={{ color: "rgba(236,231,216,0.4)" }}>
            picked at random
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Status">
          <select {...register("status")} className="admin-select">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pinned">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("pinned")} className="accent-pink-500" />
            <span style={{ color: "rgba(236,231,216,0.7)" }}>Pin to top</span>
          </label>
        </Field>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="admin-btn admin-btn-primary">
          {isSubmitting ? "Saving..." : mode === "new" ? "Create song" : "Save changes"}
        </button>
        <Link href="/admin/songs" className="admin-link text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label className="admin-label">{label}</label>
        {hint && <span className="text-[10px] mono" style={{ color: "rgba(236,231,216,0.4)" }}>{hint}</span>}
      </div>
      {children}
      {error && <div className="text-xs mt-1" style={{ color: "#ff7370" }}>{error}</div>}
    </div>
  );
}
