import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BulkSearchCard from "@/components/gst-bulk-search/BulkSearchCard";
import Link from "next/link";
import { ArrowLeft, Download, HelpCircle } from "lucide-react";

export default function GstBulkSearchPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <a
              href="/samples/gstins_template.csv"
              download="gstins_template.csv"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4 text-blue-600" /> Download Sample GSTINs (.csv)
            </a>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">GST Bulk Search Service</h1>
            <p className="text-slate-600 mt-2 text-lg">
              Query taxpayer details, registration status, and compliance records for multiple GSTINs simultaneously.
            </p>
          </div>

          {/* How It Works Section */}
          <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" /> How GST Bulk Search Works
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">1</div>
                <h3 className="font-bold text-slate-900 mb-2">Input GSTINs</h3>
                <p className="text-sm text-slate-600">
                  Paste a list of GSTINs directly into the text box (one per line) or upload an Excel/CSV file containing a <strong className="text-slate-800">GSTIN</strong> column. Download the sample CSV above for reference.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm mb-3">2</div>
                <h3 className="font-bold text-slate-900 mb-2">Automated Querying</h3>
                <p className="text-sm text-slate-600">
                  Our backend engine securely queries the GST portal database, fetching taxpayer legal names, trade names, registration status, principal place of business, and active core details.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm mb-3">3</div>
                <h3 className="font-bold text-slate-900 mb-2">Export Excel Report</h3>
                <p className="text-sm text-slate-600">
                  Download a professionally formatted Excel spreadsheet containing all queried taxpayer records ready for filing verification or client reporting.
                </p>
              </div>
            </div>
          </div>

          <BulkSearchCard />
        </div>
      </main>
    </ProtectedRoute>
  );
}
