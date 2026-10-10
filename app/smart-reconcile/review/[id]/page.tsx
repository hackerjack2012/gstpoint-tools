"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ArrowLeft, CheckCircle2, XCircle, ShieldCheck, MessageSquare, AlertTriangle } from "lucide-react";

export default function ManualReviewPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    // Fetch match details by querying runs or fetching all matches
    // Since we need match + run, we can fetch all runs and find match, or create a specialized API route.
    // Let's create a fetch or search through run matches.
    fetch("/api/smart-reconcile/runs")
      .then(res => res.json())
      .then(async data => {
        if (data.success && data.runs.length > 0) {
          // Find which run contains this match
          for (const run of data.runs) {
            const resMatch = await fetch(`/api/smart-reconcile/matches?runId=${run.id}`);
            const jsonMatch = await resMatch.json();
            if (jsonMatch.success) {
              const found = jsonMatch.run.matches.find((m: any) => m.id === matchId);
              if (found) {
                setMatchData({
                  match: found,
                  invoices: jsonMatch.run.invoices,
                  runId: run.id,
                });
                setRemarks(found.remarks || "");
                break;
              }
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch review match:", err);
        setLoading(false);
      });
  }, [matchId]);

  const handleUpdateReview = async (reviewStatus: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/smart-reconcile/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, reviewStatus, remarks }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      router.push(`/smart-reconcile/results/${matchData.runId}`);
    } catch (err: any) {
      alert("Failed to save review decision: " + err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">
          Loading manual review details...
        </div>
      </ProtectedRoute>
    );
  }

  if (!matchData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Match Not Found</h1>
          <p className="text-slate-500 mb-6">The requested reconciliation match item could not be found.</p>
          <Link href="/smart-reconcile" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow">
            Back to Dashboard
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  const { match, invoices } = matchData;
  const invoiceMap = new Map<string, any>(invoices.map((inv: any) => [inv.id, inv]));

  const pr = match.prInvoiceId ? invoiceMap.get(match.prInvoiceId) : null;
  const b2b = match.gstr2bInvoiceId ? invoiceMap.get(match.gstr2bInvoiceId) : null;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50/50 py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <Link href={`/smart-reconcile/results/${matchData.runId}`} className="text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Results
            </Link>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              match.matchStatus === "EXACT" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}>
              Status: {match.matchStatus}
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Manual Review & ITC Decision
            </h1>
            <p className="mt-1 text-slate-600">
              Compare Purchase Register and GSTR-2B entry side by side and record your compliance review decision.
            </p>
          </div>

          {/* Side by side comparison */}
          <div className="grid gap-8 md:grid-cols-2 mb-8">
            {/* PR Side */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-lg">Purchase Register (Books)</h2>
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">Internal Ledger</span>
              </div>
              {pr ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">GSTIN</span>
                    <span className="font-bold text-slate-800">{pr.gstin}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Supplier Name</span>
                    <span className="font-medium text-slate-800">{pr.supplierName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Invoice No</span>
                    <span className="font-bold text-slate-800">{pr.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Invoice Date</span>
                    <span className="font-medium text-slate-800">{pr.invoiceDate}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Taxable Value</span>
                    <span className="font-bold text-slate-900">₹{pr.taxableValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">IGST / CGST / SGST</span>
                    <span className="font-medium text-slate-800">₹{pr.igst} / ₹{pr.cgst} / ₹{pr.sgst}</span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 italic">No corresponding Purchase Register entry.</div>
              )}
            </div>

            {/* GSTR-2B Side */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-lg">GSTR-2B (Portal)</h2>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">GST Portal</span>
              </div>
              {b2b ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">GSTIN</span>
                    <span className="font-bold text-slate-800">{b2b.gstin}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Supplier Name</span>
                    <span className="font-medium text-slate-800">{b2b.supplierName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Invoice No</span>
                    <span className="font-bold text-slate-800">{b2b.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Invoice Date</span>
                    <span className="font-medium text-slate-800">{b2b.invoiceDate}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Taxable Value</span>
                    <span className="font-bold text-slate-900">₹{b2b.taxableValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">IGST / CGST / SGST</span>
                    <span className="font-medium text-slate-800">₹{b2b.igst} / ₹{b2b.cgst} / ₹{b2b.sgst}</span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 italic">No corresponding GSTR-2B entry.</div>
              )}
            </div>
          </div>

          {/* Review Decision Box */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Review Decision & Audit Remarks</h2>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Remarks / Notes</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Enter audit remarks or explanation for discrepancy..."
                className="w-full rounded-2xl border border-slate-300 p-4 text-sm font-medium focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdateReview("REJECTED")}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-bold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" /> Reject / Disallow ITC
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdateReview("ACCEPTED")}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" /> Accept Match & Claim ITC
              </button>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
