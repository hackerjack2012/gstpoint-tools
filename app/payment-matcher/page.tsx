import UploadCard from "@/components/payment-matcher/UploadCard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import { ArrowLeft, Download, HelpCircle, CheckCircle2 } from "lucide-react";

export default function PaymentMatcherPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <a
              href="/samples/payment_matcher_template.csv"
              download="payment_matcher_template.csv"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4 text-blue-600" /> Download Sample Template (.csv)
            </a>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-slate-900">
              Payment Matcher
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              Automate supplier payment matching using FIFO logic, calculate delayed payment interest, and verify Rule 37 compliance.
            </p>
          </div>

          {/* How It Works Section */}
          <div className="mb-10 rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" /> How Payment Matcher Works
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">1</div>
                <h3 className="font-bold text-slate-900 mb-2">Prepare Your Ledger</h3>
                <p className="text-sm text-slate-600">
                  Ensure your Excel/CSV file contains columns for <strong className="text-slate-800">Invoice Date, Invoice Number, Supplier Name, GSTIN, Invoice Amount, Payment Date, and Payment Amount</strong>. Download the sample template above for exact column structure.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm mb-3">2</div>
                <h3 className="font-bold text-slate-900 mb-2">Configure Parameters</h3>
                <p className="text-sm text-slate-600">
                  Select your ledger format (Single or Multi-ledger), set your applicable GST rate (e.g., 18%), and set the delayed payment threshold days (e.g., 180 days for Rule 37).
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm mb-3">3</div>
                <h3 className="font-bold text-slate-900 mb-2">Process & Download</h3>
                <p className="text-sm text-slate-600">
                  Click process to execute FIFO allocation. The system generates a comprehensive Excel report with matched transactions, outstanding balances, delayed days, and interest calculations.
                </p>
              </div>
            </div>
          </div>

          <div>
            <UploadCard />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
