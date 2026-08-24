"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import Link from "next/link";

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "enterprise">("pro");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session && selectedPlan) {
      generateQRCode();
    }
  }, [session, selectedPlan]);

  const generateQRCode = async () => {
    if (!session?.user?.email) return;

    setIsLoading(true);
    try {
      // Create a payment record
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          plan: selectedPlan,
          amount: selectedPlan === "pro" ? 499 : 1499,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Failed to create payment");
        return;
      }

      setPaymentId(data.paymentId);

      // Generate QR code with UPI payment link
      const upiLink = getUPILink(session.user.email, selectedPlan);
      const qrUrl = await QRCode.toDataURL(upiLink);
      setQrCodeUrl(qrUrl);
    } catch (error) {
      toast.error("Failed to generate QR code");
    } finally {
      setIsLoading(false);
    }
  };

  const getUPILink = (email: string, plan: string) => {
    const amount = plan === "pro" ? 499 : 1499;
    const merchantName = "GSTPoint Tools";
    const transactionId = `GSTPT-${Date.now()}`;
    const transactionNote = `Subscription for ${plan.toUpperCase()} Plan`;

    // UPI payment link format
    return `upi://pay?pa=gstpoint@yourbank&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${transactionId}&url=https://gstpoint-tools.com`;
  };

  const verifyPayment = async () => {
    if (!paymentId) return;

    setIsVerifying(true);
    try {
      const response = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Payment verified! Your plan has been upgraded.");
        router.push("/account");
      } else {
        toast.error(data.error || "Payment verification failed");
      }
    } catch (error) {
      toast.error("Failed to verify payment");
    } finally {
      setIsVerifying(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentId) return;

    try {
      const response = await fetch("/api/payment/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });

      const data = await response.json();

      if (data.success && data.paid) {
        toast.success("Payment confirmed! Redirecting...");
        setTimeout(() => router.push("/account"), 2000);
      }
    } catch (error) {
      // Silent check
    }
  };

  // Auto-check payment status every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (paymentId) {
        checkPaymentStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [paymentId]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900">Subscribe to a Plan</h1>
          <p className="mt-3 text-slate-600">
            Choose your plan and pay using UPI QR code
          </p>
        </div>

        {/* Plan Selection */}
        <div className="bg-white rounded-3xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Select Your Plan</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div
              onClick={() => setSelectedPlan("pro")}
              className={`rounded-2xl border-2 p-6 cursor-pointer transition ${selectedPlan === "pro" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Professional</h3>
                  <p className="text-slate-600 mt-1">For growing businesses</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-900">₹499</p>
                  <p className="text-sm text-slate-500">/month</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Unlimited file processing, all tools included
              </p>
              {selectedPlan === "pro" && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span className="text-sm font-semibold text-blue-600">Selected</span>
                </div>
              )}
            </div>

            <div
              onClick={() => setSelectedPlan("enterprise")}
              className={`rounded-2xl border-2 p-6 cursor-pointer transition ${selectedPlan === "enterprise" ? "border-purple-500 bg-purple-50" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Enterprise</h3>
                  <p className="text-slate-600 mt-1">For large teams</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-900">₹1499</p>
                  <p className="text-sm text-slate-500">/month</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Everything in Professional + team features
              </p>
              {selectedPlan === "enterprise" && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  <span className="text-sm font-semibold text-purple-600">Selected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Payment */}
        {qrCodeUrl && (
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Pay Using UPI
            </h2>

            <div className="text-center mb-8">
              <p className="text-slate-600 mb-2">
                Scan this QR code with any UPI app
              </p>
              <p className="text-3xl font-bold text-slate-900">
                ₹{selectedPlan === "pro" ? 499 : 1499}
              </p>
              <p className="text-slate-500">
                {selectedPlan === "pro" ? "Professional Plan" : "Enterprise Plan"}
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-8">
              <div className="bg-white p-4 rounded-2xl shadow-lg">
                <img
                  src={qrCodeUrl}
                  alt="UPI Payment QR Code"
                  className="w-64 h-64"
                />
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">How to Pay:</h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">1</span>
                  <span className="text-slate-600">Open any UPI app (PhonePe, Google Pay, Paytm, etc.)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">2</span>
                  <span className="text-slate-600">Scan the QR code above</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">3</span>
                  <span className="text-slate-600">Enter amount: ₹{selectedPlan === "pro" ? 499 : 1499}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">4</span>
                  <span className="text-slate-600">Complete the payment</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">5</span>
                  <span className="text-slate-600">
                    Payment will be verified automatically within 1-2 minutes
                  </span>
                </li>
              </ol>
            </div>

            {/* Payment Status */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Payment Status</h4>
                    <p className="text-sm text-slate-600">Waiting for payment confirmation</p>
                  </div>
                </div>
                <button
                  onClick={verifyPayment}
                  disabled={isVerifying}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isVerifying ? "Verifying..." : "Verify Payment"}
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-slate-500">
              <p>
                Having trouble?{" "}
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Contact Support
                </button>
              </p>
            </div>
          </div>
        )}

        {!qrCodeUrl && !isLoading && (
          <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
            <p className="text-slate-600 mb-4">Select a plan to generate QR code</p>
            <button
              onClick={generateQRCode}
              className="rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition"
            >
              Generate QR Code
            </button>
          </div>
        )}

        {isLoading && (
          <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
            <svg className="animate-spin h-12 w-12 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-slate-600">Generating QR code...</p>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/account" className="text-slate-500 hover:text-slate-700">
            ← Back to Account
          </Link>
        </div>
      </div>
    </main>
  );
}
