import BulkUploader from "../_components/BulkUploader";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function BulkUploadPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl text-zinc-100">Bulk upload</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Drop multiple audio files. Max 3 in parallel · ≤ 30 MB each.</p>
        </div>
        <Link href="/admin/songs" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Back to songs
        </Link>
      </div>
      <BulkUploader />
    </div>
  );
}
