import BulkUploader from "../_components/BulkUploader";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function BulkUploadPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif">Bulk upload</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(236,231,216,0.5)" }}>
            Drop multiple audio files. Max 3 in parallel · ≤ 30 MB each.
          </p>
        </div>
        <Link href="/admin/songs" className="admin-link text-sm">
          ← Back to songs
        </Link>
      </div>
      <BulkUploader />
    </div>
  );
}
