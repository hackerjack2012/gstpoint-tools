"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: "/" });
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      // Fetch user data
      fetchUserData();
    }
  }, [status]);

  const fetchUserData = async () => {
    try {
      // Fetch payments (mock data for now)
      setPayments([
        { id: "1", amount: 499, currency: "INR", plan: "PRO", status: "COMPLETED", date: "2024-07-25", paymentId: "PAY123456" },
      ]);

      // Fetch recent files (mock data for now)
      setRecentFiles([
        { id: "1", filename: "ledger_july.xlsx", status: "COMPLETED", date: "2024-07-29", size: "2.5 MB" },
        { id: "2", filename: "purchases.xlsx", status: "COMPLETED", date: "2024-07-28", size: "1.8 MB" },
      ]);
    } catch (error) {
      toast.error("Failed to fetch data");
    }
  };

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
    router.push("/auth/login");
    return null;
  }

  const getPlanName = (plan: string) => {
    switch (plan) {
      case "PRO": return "Professional";
      case "ENTERPRISE": return "Enterprise";
      default: return "Free";
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "PRO": return "bg-blue-100 text-blue-700";
      case "ENTERPRISE": return "bg-purple-100 text-purple-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900">My Account</h1>
          <p className="mt-3 text-slate-600">
            Manage your GSTPoint Tools account and settings
          </p>
        </div>

        {/* Account Card */}
        <div className="rounded-3xl bg-white p-8 shadow-lg">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Section */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">Profile</h2>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500">
                    Name
                  </label>
                  <p className="text-lg text-slate-900">{session?.user?.name || "Not set"}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500">
                    Email
                  </label>
                  <p className="text-lg text-slate-900">{session?.user?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500">
                    Current Plan
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPlanColor(session?.user?.plan || "FREE")}`}>
                      {getPlanName(session?.user?.plan || "FREE")}
                    </span>
                    {session?.user?.plan === "FREE" && (
                      <Link href="/payment" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Upgrade
                      </Link>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500">
                    Email Verified
                  </label>
                  <p className="text-lg text-slate-900">
                    {session?.user?.emailVerified ? "✓ Verified" : "✗ Not Verified"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500">
                    Files Processed
                  </label>
                  <p className="text-lg text-slate-900">{session?.user?.usageCount || 0} files</p>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-xl border border-red-300 bg-white px-6 py-3 text-red-600 font-semibold hover:bg-red-50 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging out...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>

              <div className="mt-6 grid gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition"
                >
                  <div className="rounded-lg bg-blue-100 p-3">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Dashboard</h3>
                    <p className="text-sm text-slate-500">Access all tools</p>
                  </div>
                </Link>

                <Link
                  href="/payment-matcher"
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition"
                >
                  <div className="rounded-lg bg-green-100 p-3">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Payment Matcher</h3>
                    <p className="text-sm text-slate-500">Process files now</p>
                  </div>
                </Link>

                {session?.user?.plan === "FREE" && (
                  <Link
                    href="/payment"
                    className="flex items-center gap-4 rounded-xl border border-purple-200 bg-purple-50 p-4 hover:bg-purple-100 transition"
                  >
                    <div className="rounded-lg bg-purple-100 p-3">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Upgrade Plan</h3>
                      <p className="text-sm text-slate-500">Get more features</p>
                    </div>
                  </Link>
                )}

                <Link
                  href="/pricing"
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition"
                >
                  <div className="rounded-lg bg-purple-100 p-3">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Pricing</h3>
                    <p className="text-sm text-slate-500">View all plans</p>
                  </div>
                </Link>

                <Link
                  href="/"
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition"
                >
                  <div className="rounded-lg bg-slate-100 p-3">
                    <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Home</h3>
                    <p className="text-sm text-slate-500">Back to homepage</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="mt-8 rounded-3xl bg-white p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Subscription</h2>
            {session?.user?.plan === "FREE" && (
              <Link
                href="/payment"
                className="rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition"
              >
                Upgrade Plan
              </Link>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Current Plan</h3>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  session?.user?.plan === "PRO" ? "bg-blue-100" :
                  session?.user?.plan === "ENTERPRISE" ? "bg-purple-100" : "bg-slate-100"
                }`}>
                  <span className="text-2xl">
                    {session?.user?.plan === "PRO" ? "💼" : session?.user?.plan === "ENTERPRISE" ? "🏢" : "🆓"}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{getPlanName(session?.user?.plan || "FREE")}</h4>
                  <p className="text-slate-600">
                    {session?.user?.plan === "FREE" ? "₹0/month" : session?.user?.plan === "PRO" ? "₹499/month" : "₹1499/month"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Plan Features</h3>
              <ul className="space-y-3">
                {(session?.user?.plan === "PRO" || session?.user?.plan === "ENTERPRISE") && (
                  <>
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-600">Unlimited file processing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-600">All tools included</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-600">Priority support</span>
                    </li>
                  </>
                )}
                {session?.user?.plan === "FREE" && (
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">Up to 5 files/month</span>
                  </li>
                )}
                {session?.user?.plan === "ENTERPRISE" && (
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">Team collaboration</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {payments.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Payment History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 font-semibold text-slate-600">Date</th>
                      <th className="text-left py-3 font-semibold text-slate-600">Plan</th>
                      <th className="text-left py-3 font-semibold text-slate-600">Amount</th>
                      <th className="text-left py-3 font-semibold text-slate-600">Status</th>
                      <th className="text-right py-3 font-semibold text-slate-600">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-100">
                        <td className="py-3 text-slate-600">{payment.date}</td>
                        <td className="py-3 text-slate-900">{payment.plan}</td>
                        <td className="py-3 text-slate-900">₹{payment.amount}</td>
                        <td className="py-3">
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        <div className="mt-8 rounded-3xl bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900">Your Usage</h2>
          <p className="mt-2 text-slate-600">
            Track your file processing activity
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900">Total Files</h3>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                {session?.user?.usageCount || 0}
              </p>
              <p className="text-sm text-slate-500">
                {session?.user?.plan === "FREE" ? "5 files/month included" : "Unlimited"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900">Speed</h3>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                Fast
              </p>
              <p className="text-sm text-slate-500">
                {session?.user?.plan === "PRO" || session?.user?.plan === "ENTERPRISE" ? "Priority processing" : "Standard processing"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900">Support</h3>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                {session?.user?.plan === "ENTERPRISE" ? "24/7" : session?.user?.plan === "PRO" ? "Priority" : "Email"}
              </p>
              <p className="text-sm text-slate-500">
                {session?.user?.plan === "ENTERPRISE" ? "Dedicated support" : session?.user?.plan === "PRO" ? "Priority email support" : "Basic email support"}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Files */}
        {recentFiles.length > 0 && (
          <div className="mt-8 rounded-3xl bg-white p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900">Recent Files</h2>
            <p className="mt-2 text-slate-600">
              Your recently processed files
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 font-semibold text-slate-600">Filename</th>
                    <th className="text-left py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-left py-3 font-semibold text-slate-600">Date</th>
                    <th className="text-left py-3 font-semibold text-slate-600">Size</th>
                    <th className="text-right py-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFiles.map((file) => (
                    <tr key={file.id} className="border-b border-slate-100">
                      <td className="py-3 text-slate-900">{file.filename}</td>
                      <td className="py-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          file.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                          file.status === "PROCESSING" ? "bg-blue-100 text-blue-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {file.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{file.date}</td>
                      <td className="py-3 text-slate-600">{file.size}</td>
                      <td className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm">
                            Download
                          </button>
                          <button className="px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
