"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import { ArrowLeft, Download, Globe, ShieldCheck, FileSpreadsheet, Layers, HelpCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function GSTPortalDownloaderPage() {
  const handleDownloadZip = () => {
    toast.success("Downloading GST Portal Downloader extension ZIP...");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <span className="rounded-full bg-blue-100 px-4 py-1 text-xs font-bold text-blue-700">
              Chrome Extension v0.3.1
            </span>
          </div>

          {/* Hero Card */}
          <div className="rounded-3xl bg-white p-8 md:p-12 shadow-sm border border-slate-200 mb-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 text-blue-600">
                  <Globe className="w-8 h-8" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                  GST Portal Downloader
                </h1>
                <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                  Automate downloading <span className="font-semibold text-slate-900">DRC-03</span> files and <span className="font-semibold text-slate-900">Refunds</span> (Applications, Notices, Replies, and Orders) directly from the Indian GST Portal with a multi-client queue, live side-panel ledger, and one-click Excel export.
                </p>
              </div>

              <div className="flex flex-col gap-4 w-full md:w-auto">
                <a
                  href="/gst-portal-downloader.zip"
                  download="gst-portal-downloader.zip"
                  onClick={handleDownloadZip}
                  className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition"
                >
                  <Download className="w-5 h-5" /> Download Extension (.zip)
                </a>
                <p className="text-xs text-center text-slate-500">
                  Compatible with Google Chrome & Chromium browsers
                </p>
              </div>
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="grid gap-8 lg:grid-cols-3 mb-12">
            <div className="lg:col-span-2 rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
                How to Install in Google Chrome
              </h2>

              <ol className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <div>
                    <h3 className="font-bold text-slate-900">Download and Extract ZIP</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Click the download button above to get <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono">gst-portal-downloader.zip</code>. Right-click the downloaded file and extract it into a permanent folder on your computer.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <div>
                    <h3 className="font-bold text-slate-900">Open Chrome Extensions</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Open Google Chrome, type <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono">chrome://extensions/</code> in the address bar, and press Enter.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <div>
                    <h3 className="font-bold text-slate-900">Enable Developer Mode</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Toggle on the <strong className="text-slate-900">Developer mode</strong> switch located in the top-right corner of the Extensions page.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">4</div>
                  <div>
                    <h3 className="font-bold text-slate-900">Load Unpacked Extension</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Click the <strong className="text-slate-900">Load unpacked</strong> button in the top-left corner and select your extracted <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono">gst-portal-downloader</code> folder.
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">5</div>
                  <div>
                    <h3 className="font-bold text-slate-900">Start Automating</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Pin the extension for quick access. Open the GST Portal login page, click the extension icon, enter credentials or add clients to the queue, and click <strong className="text-slate-900">Start new run</strong>!
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Quick Specs / Highlights */}
            <div className="space-y-6">
              <div className="rounded-3xl bg-slate-900 text-white p-8 shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-green-400" /> Secure & Private
                </h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>No credentials are sent to any external servers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>Works directly within your browser session on the GST portal.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>Compatible with existing CAPTCHA solving extensions.</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" /> Key Deliverables
                </h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>DRC-03 Application files & attachments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>Refunds (Applications, Notices, Replies, Orders)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>Multi-client queue & side-panel live ledger</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">•</span>
                    <span>One-click Excel (.xlsx) & JSON report export</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
