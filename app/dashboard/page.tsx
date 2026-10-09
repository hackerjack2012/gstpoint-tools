"use client";

import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, Zap } from "lucide-react";

export default function DashboardPage() {
  const tools = [
    {
      name: "GST Portal Downloader",
      href: "/gst-portal-downloader",
      status: "Available",
      description: "Chrome extension to download DRC-03 files & Refunds with client queue & Excel export.",
      icon: "🌐",
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      name: "Payment Matcher",
      href: "/payment-matcher",
      status: "Available",
      description: "Automatically match supplier payments using FIFO logic and calculate delayed payment interest.",
      icon: "💰",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      name: "GST Bulk Search",
      href: "/gst-bulk-search",
      status: "Available",
      description: "Search multiple GSTINs in bulk and download comprehensive taxpayer reports.",
      icon: "🔍",
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      name: "Return Filing Checker",
      href: "/filing-checker",
      status: "Available",
      description: "Check filing status of multiple GSTINs in one go and export the results.",
      icon: "📋",
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      name: "GSTR-2B Reconciliation",
      href: "/reconciliation",
      status: "Coming Soon",
      description: "Compare Purchase Register with GSTR-2B and identify mismatches instantly.",
      icon: "📊",
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      name: "GST Calculators",
      href: "/calculators",
      status: "Coming Soon",
      description: "Calculate GST late fees, interest, Rule 37 implications, and more.",
      icon: "🧮",
      color: "bg-rose-50 text-rose-600 border-rose-100",
    },
  ];

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50/50 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10"
          >
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                GSTPoint Dashboard
              </h1>
              <p className="mt-1 text-slate-600">
                Select a tool below to start automating your GST workflows with professional precision.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/account"
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                My Account & Files
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08 },
              },
            }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {tools.map((tool) => (
              <motion.div
                key={tool.name}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
              >
                <Link
                  href={tool.href}
                  className={`group relative flex flex-col justify-between h-full rounded-3xl border bg-white p-7 shadow-sm transition-all duration-200 hover:shadow-xl hover:border-slate-300 ${
                    tool.status === "Coming Soon" ? "opacity-75" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${tool.color}`}>
                        {tool.icon}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          tool.status === "Available"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {tool.status}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold">
                    {tool.status === "Available" ? (
                      <>
                        <span className="text-emerald-600 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Ready to use
                        </span>
                        <span className="text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Launch <ArrowRight className="w-4 h-4" />
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Coming soon
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
