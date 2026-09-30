import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BulkSearchCard from "@/components/gst-bulk-search/BulkSearchCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GstBulkSearchPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">GST Bulk Search Service</h1>
            <p className="text-muted-foreground mt-2">
              Query taxpayer details and filing records for multiple GSTINs simultaneously.
            </p>
          </div>

          <BulkSearchCard />
        </div>
      </main>
    </ProtectedRoute>
  );
}
