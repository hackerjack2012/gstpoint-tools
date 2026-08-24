import UploadCard from "@/components/payment-matcher/UploadCard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function PaymentMatcherPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-5xl font-bold text-slate-900">
            Payment Matcher
          </h1>

          <p className="mt-3 text-lg text-slate-600">
            Upload your ledger and automatically match payments using FIFO.
          </p>

          <div className="mt-12">
            <UploadCard />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
