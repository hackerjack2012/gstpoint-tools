"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ArrowLeft, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, Sparkles, ArrowRight } from "lucide-react";

const REQUIRED_FIELDS = [
  { key: "gstin", label: "Supplier GSTIN", required: true },
  { key: "supplierName", label: "Supplier Name", required: false },
  { key: "invoiceNo", label: "Invoice Number", required: true },
  { key: "invoiceDate", label: "Invoice Date", required: true },
  { key: "docType", label: "Document Type (INV/CRN/DBN)", required: false },
  { key: "taxableValue", label: "Taxable Value", required: true },
  { key: "invoiceValue", label: "Invoice Value", required: false },
  { key: "igst", label: "IGST Amount", required: false },
  { key: "cgst", label: "CGST Amount", required: false },
  { key: "sgst", label: "SGST / UTGST Amount", required: false },
  { key: "cess", label: "Cess Amount", required: false },
  { key: "gstRate", label: "GST Rate (%)", required: false },
  { key: "returnPeriod", label: "Return Period", required: false },
];

export default function NewReconciliationPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [title, setTitle] = useState("GST Reconciliation - " + new Date().toLocaleString("default", { month: "long", year: "numeric" }));
  const [taxPeriod, setTaxPeriod] = useState("2025-03");

  const [prFile, setPrFile] = useState<File | null>(null);
  const [gstr2bFile, setGstr2bFile] = useState<File | null>(null);

  const [prData, setPrData] = useState<any>(null);
  const [gstr2bData, setGstr2bData] = useState<any>(null);

  const [prMapping, setPrMapping] = useState<Record<string, string>>({});
  const [gstr2bMapping, setGstr2bMapping] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prFile || !gstr2bFile) {
      setError("Please upload both Purchase Register and GSTR-2B files.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Upload & parse PR
      const prFormData = new FormData();
      prFormData.append("file", prFile);
      prFormData.append("sourceType", "PR");

      const prRes = await fetch("/api/smart-reconcile/upload", {
        method: "POST",
        body: prFormData,
      });
      const prJson = await prRes.json();
      if (!prJson.success) throw new Error(prJson.error || "Failed to parse Purchase Register");

      // Upload & parse 2B
      const b2bFormData = new FormData();
      b2bFormData.append("file", gstr2bFile);
      b2bFormData.append("sourceType", "GSTR2B");

      const b2bRes = await fetch("/api/smart-reconcile/upload", {
        method: "POST",
        body: b2bFormData,
      });
      const b2bJson = await b2bRes.json();
      if (!b2bJson.success) throw new Error(b2bJson.error || "Failed to parse GSTR-2B");

      setPrData(prJson);
      setGstr2bData(b2bJson);
      setPrMapping(prJson.autoMapping || {});
      setGstr2bMapping(b2bJson.autoMapping || {});
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Error processing files");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReconciliation = async () => {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("taxPeriod", taxPeriod);
      formData.append("prFile", prFile!);
      formData.append("prMapping", JSON.stringify(prMapping));
      formData.append("gstr2bFile", gstr2bFile!);
      formData.append("gstr2bMapping", JSON.stringify(gstr2bMapping));

      const res = await fetch("/api/smart-reconcile/process", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.error || "Reconciliation processing failed");

      router.push(`/smart-reconcile/results/${json.runId}`);
    } catch (err: any) {
      setError(err.message || "Failed to execute reconciliation");
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50/50 py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/smart-reconcile" className="text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Reconcile Dashboard
            </Link>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              <Sparkles className="w-4 h-4" /> Step {step} of 2
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Start New Reconciliation
            </h1>
            <p className="mt-1 text-slate-600">
              Upload your Purchase Register and GSTR-2B spreadsheets and map columns for multi-stage matching.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleFileUpload} className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
                <h2 className="text-xl font-bold text-slate-900">1. Run Details</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Reconciliation Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tax Period / Month</label>
                    <input
                      type="text"
                      value={taxPeriod}
                      onChange={e => setTaxPeriod(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                {/* Purchase Register Upload */}
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Purchase Register (Books)</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Upload your enterprise purchase ledger Excel (.xlsx) or CSV file.
                    </p>
                  </div>
                  <div className="mt-8">
                    <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition">
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={e => setPrFile(e.target.files?.[0] || null)}
                      />
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <span className="text-sm font-bold text-slate-700 block">
                        {prFile ? prFile.name : "Click to browse Purchase Register"}
                      </span>
                      <span className="text-xs text-slate-400 mt-1 block">XLSX, XLS or CSV</span>
                    </label>
                  </div>
                </div>

                {/* GSTR-2B Upload */}
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">GSTR-2B (Portal Export)</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Upload the official GSTR-2B JSON or Excel downloaded from the GST portal.
                    </p>
                  </div>
                  <div className="mt-8">
                    <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition">
                      <input
                        type="file"
                        accept=".xlsx, .xls, .json, .csv"
                        className="hidden"
                        onChange={e => setGstr2bFile(e.target.files?.[0] || null)}
                      />
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <span className="text-sm font-bold text-slate-700 block">
                        {gstr2bFile ? gstr2bFile.name : "Click to browse GSTR-2B file"}
                      </span>
                      <span className="text-xs text-slate-400 mt-1 block">XLSX, JSON or CSV</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? "Parsing & Analyzing Spreadsheets..." : "Continue to Column Mapping"} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && prData && gstr2bData && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-2">2. Map Excel Columns</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Link your uploaded spreadsheet columns to the required GST reconciliation fields. Our system auto-detected matches based on column header aliases.
                </p>

                <div className="grid gap-8 md:grid-cols-2">
                  {/* PR Mapping */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 pb-2 border-b border-slate-100">
                      Purchase Register Columns ({prData.filename})
                    </h3>
                    {REQUIRED_FIELDS.map(field => (
                      <div key={field.key} className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                          <span>{field.label} {field.required && <span className="text-rose-500">*</span>}</span>
                        </label>
                        <select
                          value={prMapping[field.key] || ""}
                          onChange={e => setPrMapping({ ...prMapping, [field.key]: e.target.value })}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">-- Select Column --</option>
                          {prData.headers.map((h: string) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* GSTR-2B Mapping */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 pb-2 border-b border-slate-100">
                      GSTR-2B Columns ({gstr2bData.filename})
                    </h3>
                    {REQUIRED_FIELDS.map(field => (
                      <div key={field.key} className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                          <span>{field.label} {field.required && <span className="text-rose-500">*</span>}</span>
                        </label>
                        <select
                          value={gstr2bMapping[field.key] || ""}
                          onChange={e => setGstr2bMapping({ ...gstr2bMapping, [field.key]: e.target.value })}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">-- Select Column --</option>
                          {gstr2bData.headers.map((h: string) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Back to Files
                </button>
                <button
                  type="button"
                  onClick={handleProcessReconciliation}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {loading ? "Running Multi-Stage Matching..." : "Run Smart Reconciliation"} <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
