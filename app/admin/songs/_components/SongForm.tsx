"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SongCreateSchema, GENRES, STATUSES, type SongCreateInput } from "@/lib/songs";
import Link from "next/link";

type Props = {
  mode: "new" | "edit";
  songId?: number;
  defaults: Partial<SongCreateInput>;
  suggestedFreq?: string;
};

export default function SongForm({ mode, songId, defaults, suggestedFreq }: Props) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SongCreateInput>({
    resolver: zodResolver(SongCreateSchema),
    defaultValues: {
      title: defaults.title ?? "",
      genre: defaults.genre ?? "Ambient",
      freq: defaults.freq ?? suggestedFreq ?? "",
      bpm: defaults.bpm ?? 0,
      durationSeconds: defaults.durationSeconds ?? 0,
      gradientFrom: defaults.gradientFrom ?? "#E91E8C",
      gradientTo: defaults.gradientTo ?? "#880E4F",
      pinned: defaults.pinned ?? false,
      status: defaults.status ?? "draft",
    },
  });

  const gFrom = watch("gradientFrom");
  const gTo = watch("gradientTo");

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <Field label="Title" error={errors.title?.message}>
        <input
          {...register("title")}
          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Genre" error={errors.genre?.message}>
          <select
            {...register("genre")}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          >
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
          <input
            {...register("freq")}
            placeholder="88.3"
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="BPM (optional)" error={errors.bpm?.message}>
          <input
            type="number"
            {...register("bpm", { valueAsNumber: true })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Duration seconds (optional)" error={errors.durationSeconds?.message}>
          <input
            type="number"
            {...register("durationSeconds", { valueAsNumber: true })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="Gradient" error={errors.gradientFrom?.message || errors.gradientTo?.message}>
        <div className="flex gap-3 items-center">
          <input
            type="color"
            value={gFrom}
            onChange={(e) => setValue("gradientFrom", e.target.value, { shouldValidate: true })}
            className="w-12 h-10 bg-transparent border border-zinc-800 rounded"
          />
          <input
            type="color"
            value={gTo}
            onChange={(e) => setValue("gradientTo", e.target.value, { shouldValidate: true })}
            className="w-12 h-10 bg-transparent border border-zinc-800 rounded"
          />
          <div
            className="flex-1 h-10 rounded border border-zinc-800"
            style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}
          />
          <code className="text-[11px] text-zinc-500">{gFrom} → {gTo}</code>
        </div>
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Status">
          <select
            {...register("status")}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pinned">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("pinned")} className="accent-zinc-300" />
            <span className="text-zinc-400">Pin to top</span>
          </label>
        </Field>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded text-sm hover:bg-white disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : mode === "new" ? "Create song" : "Save changes"}
        </button>
        <Link href="/admin/songs" className="text-sm text-zinc-400 hover:text-zinc-200">
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
        <label className="text-xs uppercase tracking-wider text-zinc-400">{label}</label>
        {hint && <span className="text-[10px] text-zinc-500">{hint}</span>}
      </div>
      {children}
      {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
    </div>
  );
}
