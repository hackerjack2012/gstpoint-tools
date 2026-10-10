"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ArrowLeft, Download, CheckCircle2, AlertTriangle, Search, Filter, ShieldCheck, FileSpreadsheet } from "lucide-react";

export default function ReconciliationResultsPage() {
  const params = useParams();
  const runId = params.id as string;

  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!runId) return;
    fetch(`/api/smart-reconcile/matches?runId=${runId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRun(data.run);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch results:", err);
        setLoading(false);
      });
  }, [runId]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">
          Loading reconciliation results...
        </div>
      </ProtectedRoute>
    );
  }

  if (!run) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Reconciliation Run Not Found</h1>
          <p className="text-slate-500 mb-6">The requested reconciliation report does not exist or you do not have access.</p>
          <Link href="/smart-reconcile" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow">
            Back to Dashboard
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  const invoiceMap = new Map<string, any>(run.invoices.map((inv: any) => [inv.id, inv]));

  const filteredMatches = run.matches.filter((m: any) => {
    if (filterTab !== "ALL" && m.matchStatus !== filterTab) return false;
    if (searchTerm) {
      const pr = m.prInvoiceId ? invoiceMap.get(m.prInvoiceId) : null;
      const b2b = m.gstr2bInvoiceId ? invoiceMap.get(m.gstr2bInvoiceId) : null;
      const query = searchTerm.toLowerCase();
      const matchGstin = (pr?.gstin || b2b?.gstin || "").toLowerCase();
      const matchInv = (pr?.invoiceNo || b2b?.invoiceNo || "").toLowerCase();
      if (!matchGstin.includes(query) && !matchInv.includes(query)) return false;
    }
    return true;
  });

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50/50 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link href="/smart-reconcile" className="text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2">
                <ArrowLeft className="w-4 h-4" /> Back to Smart Reconcile
              </Link>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                {run.title}
              </h1>
              <p className="mt-1 text-slate-600">
                Tax Period: <strong className="text-slate-800">{run.taxPeriod}</strong> | Status: <span className="text-emerald-600 font-bold">{run.status}</span>
              </p>
            </div>
            <div>
              <a
                href={`/api/smart-reconcile/export?runId=${run.id}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition"
              >
                <Download className="w-5 h-5" /> Export Excel Report (.xlsx)
              </a>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <div
              onClick={() => setFilterTab("EXACT")}
              className={`cursor-pointer rounded-3xl border p-6 shadow-sm transition ${
                filterTab === "EXACT" ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 bg-white"
              }`}
            >
              <span className="text-xs font-semibold text-emerald-700">Fully Matched</span>
              <div className="mt-2 text-3xl font-extrabold text-emerald-800">{run.totalMatched}</div>
            </div>
            <div
              onClick={() => setFilterTab("AMOUNT_MISMATCH")}
              className={`cursor-pointer rounded-3xl border p-6 shadow-sm transition ${
                filterTab === "AMOUNT_MISMATCH" ? "border-amber-500 bg-amber-50/30" : "border-slate-200 bg-white"
              }`}
            >
              <span className="text-xs font-semibold text-amber-700">Amount / Tax Mismatches</span>
              <div className="mt-2 text-3xl font-extrabold text-amber-800">{run.totalMismatch}</div>
            </div>
            <div
              onClick={() => setFilterTab("ONLY_PR")}
              className={`cursor-pointer rounded-3xl border p-6 shadow-sm transition ${
                filterTab === "ONLY_PR" ? "border-blue-500 bg-blue-50/30" : "border-slate-200 bg-white"
              }`}
            >
              <span className="text-xs font-semibold text-blue-700">Only in Purchase Register</span>
              <div className="mt-2 text-3xl font-extrabold text-blue-800">{run.totalOnlyPr}</div>
            </div>
            <div
              onClick={() => setFilterTab("ONLY_2B")}
              className={`cursor-pointer rounded-3xl border p-6 shadow-sm transition ${
                filterTab === "ONLY_2B" ? "border-purple-500 bg-purple-50/30" : "border-slate-200 bg-white"
              }`}
            >
              <span className="text-xs font-semibold text-purple-700">Only in GSTR-2B</span>
              <div className="mt-2 text-3xl font-extrabold text-purple-800">{run.totalOnly2b}</div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {["ALL", "EXACT", "NORMALIZED", "AMOUNT_MISMATCH", "ONLY_PR", "ONLY_2B"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                    filterTab === tab ? "bg-blue-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search GSTIN or Invoice No..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Matches Table */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-4 px-6">Match Status</th>
                    <th className="py-4 px-6">Supplier GSTIN & Name</th>
                    <th className="py-4 px-6">Purchase Register (Books)</th>
                    <th className="py-4 px-6">GSTR-2B (Portal)</th>
                    <th className="py-4 px-6">Remarks</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredMatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                        No reconciliation records match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMatches.map((m: any) => {
                      const pr = m.prInvoiceId ? invoiceMap.get(m.prInvoiceId) : null;
                      const b2b = m.gstr2bInvoiceId ? invoiceMap.get(m.gstr2bInvoiceId) : null;

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                              m.matchStatus === "EXACT" || m.matchStatus === "NORMALIZED" ? "bg-emerald-100 text-emerald-800" :
                              m.matchStatus === "AMOUNT_MISMATCH" ? "bg-amber-100 text-amber-800" :
                              m.matchStatus === "ONLY_PR" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                            }`}>
                              {m.matchStatus}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900">{pr?.gstin || b2b?.gstin || "N/A"}</div>
                            <div className="text-xs text-slate-500 truncate max-w-xs">{pr?.supplierName || b2b?.supplierName || ""}</div>
                          </td>
                          <td className="py-4 px-6">
                            {pr ? (
                              <div>
                                <div className="font-semibold text-slate-800">{pr.invoiceNo} <span className="text-xs text-slate-400">({pr.invoiceDate})</span></div>
                                <div className="text-xs text-slate-600 font-medium">Taxable: ₹{pr.taxableValue.toLocaleString()} | IGST: ₹{pr.igst}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Not in Books</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {b2b ? (
                              <div>
                                <div className="font-semibold text-slate-800">{b2b.invoiceNo} <span className="text-xs text-slate-400">({b2b.invoiceDate})</span></div>
                                <div className="text-xs text-slate-600 font-medium">Taxable: ₹{b2b.taxableValue.toLocaleString()} | IGST: ₹{b2b.igst}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Not in GSTR-2B</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-600 max-w-xs">
                            {m.remarks}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Link
                              href={`/smart-reconcile/review/${m.id}`}
                              className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-600 hover:text-white transition"
                            >
                              Review
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
