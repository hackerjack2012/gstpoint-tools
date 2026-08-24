"use client";

import { useState, useEffect } from "react";
import { checkBackendHealth, getBackendStatus } from "@/lib/api-client";
import { toast } from "sonner";
import Link from "next/link";

export default function BackendStatusPage() {
  const [backendStatus, setBackendStatus] = useState<{ status: string; application: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const isOnline = await checkBackendHealth();
        if (isOnline) {
          const status = await getBackendStatus();
          setBackendStatus(status);
        } else {
          setError("Backend is not responding");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check backend");
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();

    // Poll every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const isOnline = await checkBackendHealth();
      if (isOnline) {
        const status = await getBackendStatus();
        setBackendStatus(status);
        toast.success("Backend is online!");
      } else {
        setError("Backend is not responding");
        toast.error("Backend is offline");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check backend");
      toast.error("Failed to check backend");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900">Backend Connection Test</h1>
          <p className="mt-3 text-slate-600">
            Check if your FastAPI backend is running and connected
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-lg max-w-2xl mx-auto">
          {/* Status Card */}
          <div className="text-center">
            {isLoading ? (
              <div className="py-12">
                <svg className="animate-spin h-16 w-16 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-slate-600">Checking backend status...</p>
              </div>
            ) : error ? (
              <div className="py-12">
                <svg className="h-16 w-16 mx-auto text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-4 text-2xl font-bold text-red-600">Backend Offline</h3>
                <p className="mt-2 text-slate-600">{error}</p>
              </div>
            ) : backendStatus ? (
              <div className="py-12">
                <svg className="h-16 w-16 mx-auto text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-2xl font-bold text-green-600">Backend Online</h3>
                <p className="mt-2 text-slate-600">
                  Status: {backendStatus.status}<br />
                  Application: {backendStatus.application}
                </p>
              </div>
            ) : null}

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Status
                </>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="font-semibold text-slate-700 mb-4">How to start the backend:</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-slate-600">Open a new terminal window</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-slate-600">
                    Navigate to: <code className="bg-slate-100 px-1 rounded">C:\Users\Rahul\gstpoint-backend</code>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-slate-600">
                    Run: <code className="bg-slate-100 px-1 rounded">.\venv\Scripts\python.exe -m uvicorn app.main:app --reload</code>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0 mt-0.5">4</span>
                <div>
                  <p className="text-slate-600">
                    Backend will start on: <code className="bg-slate-100 px-1 rounded">http://localhost:8000</code>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="font-semibold text-slate-700 mb-4">Backend API Endpoints:</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <code className="font-mono text-slate-800">GET /</code>
                  <span className="text-sm text-slate-500 ml-2">Health check</span>
                </div>
                <span className="text-sm text-green-600 font-medium">✓ Working</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <code className="font-mono text-slate-800">POST /payment-matcher/</code>
                  <span className="text-sm text-slate-500 ml-2">Process Excel file</span>
                </div>
                <span className="text-sm text-green-600 font-medium">✓ Ready</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <Link
              href="/payment-matcher"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Go to Payment Matcher
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
