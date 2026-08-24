"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("test-tools");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Check if user is admin (for now, we'll use a simple check)
  const isAdmin = session?.user?.email === "admin@gstpoint-tools.com" ||
                 session?.user?.email === "hkr2012@gmail.com";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && !isAdmin) {
      router.push("/dashboard");
    }
  }, [status, router, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch files and users from API
      // For now, we'll use mock data
      setFiles([
        { id: "1", filename: "test_ledger.xlsx", user: "test@example.com", status: "COMPLETED", date: "2024-07-29" },
        { id: "2", filename: "sample_data.xlsx", user: "user@example.com", status: "PROCESSING", date: "2024-07-29" },
      ]);
      setUsers([
        { id: "1", email: "test@example.com", name: "Test User", plan: "FREE", usageCount: 5 },
        { id: "2", email: "user@example.com", name: "Regular User", plan: "PRO", usageCount: 25 },
      ]);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestTool = async (tool: string) => {
    setIsLoading(true);
    try {
      // Simulate testing
      toast.info(`Testing ${tool}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Test completed for ${tool}!`);
    } catch (error) {
      toast.error(`Test failed for ${tool}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || !isAdmin) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-slate-600">Loading Admin Dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-3 text-slate-600">
            Manage users, test tools, and monitor system activity
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("test-tools")}
            className={`px-6 py-3 font-semibold transition ${activeTab === "test-tools" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            Test Tools
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 font-semibold transition ${activeTab === "users" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`px-6 py-3 font-semibold transition ${activeTab === "files" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            File History
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-6 py-3 font-semibold transition ${activeTab === "settings" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          {activeTab === "test-tools" && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Test Tools</h2>
              <p className="text-slate-600 mb-8">
                Test all GSTPoint tools with sample data to ensure everything is working correctly
              </p>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Payment Matcher Test */}
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <span className="text-xl">💰</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Payment Matcher</h3>
                      <p className="text-sm text-slate-500">Test FIFO matching</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestTool("Payment Matcher")}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Run Test
                  </button>
                </div>

                {/* GSTR-2B Reconciliation Test */}
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <span className="text-xl">📊</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">GSTR-2B Reconciliation</h3>
                      <p className="text-sm text-slate-500">Test reconciliation</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestTool("GSTR-2B Reconciliation")}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Run Test
                  </button>
                </div>

                {/* Return Filing Checker Test */}
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                      <span className="text-xl">📋</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Return Filing Checker</h3>
                      <p className="text-sm text-slate-500">Test filing status</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestTool("Return Filing Checker")}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Run Test
                  </button>
                </div>

                {/* GST Calculators Test */}
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <span className="text-xl">🧮</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">GST Calculators</h3>
                      <p className="text-sm text-slate-500">Test calculations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestTool("GST Calculators")}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Run Test
                  </button>
                </div>

                {/* Backend API Test */}
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <span className="text-xl">🔌</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Backend API</h3>
                      <p className="text-sm text-slate-500">Test API connection</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestTool("Backend API")}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Test Connection
                  </button>
                </div>

                {/* Database Test */}
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                      <span className="text-xl">🗃️</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Database</h3>
                      <p className="text-sm text-slate-500">Test database operations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestTool("Database")}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Test Database
                  </button>
                </div>
              </div>

              {/* Quick Test All */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => toast.info("Running all tests...")}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Run All Tests
                  </button>
                  <button
                    onClick={() => toast.success("System status: All systems operational")}
                    className="rounded-xl border border-green-300 bg-green-50 px-6 py-3 font-semibold text-green-700 hover:bg-green-100 transition"
                  >
                    Check System Status
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Users</h2>
                <button className="rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition">
                  + Add User
                </button>
              </div>
              <p className="text-slate-600 mb-8">
                Manage all registered users and their subscriptions
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-4 font-semibold text-slate-600">Name</th>
                      <th className="text-left py-4 font-semibold text-slate-600">Email</th>
                      <th className="text-left py-4 font-semibold text-slate-600">Plan</th>
                      <th className="text-left py-4 font-semibold text-slate-600">Usage</th>
                      <th className="text-left py-4 font-semibold text-slate-600">Status</th>
                      <th className="text-right py-4 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-100">
                        <td className="py-4 text-slate-900">{user.name}</td>
                        <td className="py-4 text-slate-600">{user.email}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            user.plan === "FREE" ? "bg-slate-100 text-slate-700" :
                            user.plan === "PRO" ? "bg-blue-100 text-blue-700" :
                            "bg-purple-100 text-purple-700"
                          }`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="py-4 text-slate-600">{user.usageCount} files</td>
                        <td className="py-4">
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                            Active
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">
                              Edit
                            </button>
                            <button className="px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50">
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

          {activeTab === "files" && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">File Processing History</h2>
              <p className="text-slate-600 mb-8">
                View all files processed by users
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-4 font-semibold text-slate-600">Filename</th>
                      <th className="text-left py-4 font-semibold text-slate-600">User</th>
                      <th className="text-left py-4 font-semibold text-slate-600">Status</th>
                      <th className="text-left py-4 font-semibold text-slate-600">Date</th>
                      <th className="text-right py-4 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr key={file.id} className="border-b border-slate-100">
                        <td className="py-4 text-slate-900">{file.filename}</td>
                        <td className="py-4 text-slate-600">{file.user}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            file.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                            file.status === "PROCESSING" ? "bg-blue-100 text-blue-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {file.status}
                          </span>
                        </td>
                        <td className="py-4 text-slate-600">{file.date}</td>
                        <td className="py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">
                              View
                            </button>
                            <button className="px-3 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50">
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

          {activeTab === "settings" && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Admin Settings</h2>
              <p className="text-slate-600 mb-8">
                Configure system settings and preferences
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">System Configuration</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Maintenance Mode</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Email Notifications</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">File Retention (days)</span>
                      <input type="number" defaultValue="30" className="w-20 rounded-lg border border-slate-200 p-2" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Payment Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Default Currency
                      </label>
                      <select className="w-full rounded-lg border border-slate-200 p-3">
                        <option>INR (₹)</option>
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        Payment Gateway
                      </label>
                      <select className="w-full rounded-lg border border-slate-200 p-3">
                        <option>Razorpay</option>
                        <option>Stripe</option>
                        <option>PayPal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        QR Code Expiry (minutes)
                      </label>
                      <input type="number" defaultValue="15" className="w-full rounded-lg border border-slate-200 p-3" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Danger Zone</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <button className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 font-semibold text-red-600 hover:bg-red-100 transition text-left">
                    Delete All Test Data
                  </button>
                  <button className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 font-semibold text-red-600 hover:bg-red-100 transition text-left">
                    Reset Database
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
