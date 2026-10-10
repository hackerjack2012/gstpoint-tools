"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { motion } from "motion/react";
import { ArrowLeft, Plus, FileText, CheckCircle2, AlertTriangle, Download, Clock, ShieldCheck } from "lucide-react";

export default function SmartReconcileDashboard() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/smart-reconcile/runs")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRuns(data.runs);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch runs:", err);
        setLoading(false);
      });
  }, []);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50/50 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Dashboard
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-sm font-semibold text-blue-600">Smart Reconcile</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-blue-600" /> GSTPoint Smart Reconcile
              </h1>
              <p className="mt-1 text-slate-600">
                Automate GSTR-2B vs Purchase Register reconciliation with advanced header mapping, exact & fuzzy matching, and compliance checks.
              </p>
            </div>
            <div>
              <Link
                href="/smart-reconcile/new"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" /> Start New Reconciliation
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid gap-6 md:grid-cols-4 mb-10">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="text-sm font-semibold text-slate-500">Total Runs</span>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{runs.length}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="text-sm font-semibold text-emerald-600">Successfully Matched</span>
              <div className="mt-2 text-3xl font-extrabold text-emerald-700">
                {runs.reduce((acc, r) => acc + (r.totalMatched || 0), 0)}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="text-sm font-semibold text-amber-600">Total Mismatches</span>
              <div className="mt-2 text-3xl font-extrabold text-amber-700">
                {runs.reduce((acc, r) => acc + (r.totalMismatch || 0), 0)}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="text-sm font-semibold text-blue-600">Pending Review</span>
              <div className="mt-2 text-3xl font-extrabold text-blue-700">
                {runs.reduce((acc, r) => acc + (r.totalOnlyPr || 0) + (r.totalOnly2b || 0), 0)}
              </div>
            </div>
          </div>

          {/* Runs List */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Recent Reconciliation Runs</h2>
              <span className="text-sm text-slate-500">Showing all history</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading reconciliation runs...</div>
            ) : runs.length === 0 ? (
              <div className="p-16 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">No reconciliation runs yet</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">Upload your Purchase Register and GSTR-2B files to start matching.</p>
                <Link
                  href="/smart-reconcile/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" /> Create Reconciliation
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {runs.map(run => (
                  <div key={run.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-slate-900">{run.title}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {run.taxPeriod || "Standard"}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          run.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {run.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Created on {new Date(run.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <div className="text-xs text-slate-500">Matched / Mismatch</div>
                        <div className="text-sm font-bold text-slate-800">
                          <span className="text-emerald-600">{run.totalMatched}</span> / <span className="text-amber-600">{run.totalMismatch}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/smart-reconcile/results/${run.id}`}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                        >
                          View Results
                        </Link>
                        <a
                          href={`/api/smart-reconcile/export?runId=${run.id}`}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition flex items-center gap-1.5"
                        >
                          <Download className="w-4 h-4" /> Export Excel
                        </a>
                        <button
                          onClick={async () => {
                            if (!confirm("Are you sure you want to delete this reconciliation run?")) return;
                            try {
                              const res = await fetch(`/api/smart-reconcile/runs/${run.id}`, { method: "DELETE" });
                              const json = await res.json();
                              if (json.success) {
                                setRuns(runs.filter(r => r.id !== run.id));
                              } else {
                                alert(json.error || "Failed to delete run");
                              }
                            } catch (err: any) {
                              alert("Failed to delete run: " + err.message);
                            }
                          }}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 transition"
                          title="Delete Run"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
