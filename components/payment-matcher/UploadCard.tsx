"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { processPaymentMatcher, checkBackendHealth } from "@/lib/api-client";

export default function UploadCard() {
  const [ledgerType, setLedgerType] = useState<"single" | "multi">("single");
  const [gstRate, setGstRate] = useState<string>("18");
  const [customGstRate, setCustomGstRate] = useState<string>("");
  const [delayDays, setDelayDays] = useState<string>("180");
  const [customDelayDays, setCustomDelayDays] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>("");
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  // Check backend health on component mount
  useEffect(() => {
    const checkBackend = async () => {
      const isOnline = await checkBackendHealth();
      setBackendOnline(isOnline);
      if (!isOnline) {
        toast.warning("Backend server is not running. File processing will not work.");
      }
    };
    checkBackend();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
      const validExtensions = [".xlsx", ".xls"];

      const isValidType = validTypes.includes(selectedFile.type);
      const isValidExtension = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));

      if (isValidType || isValidExtension) {
        setFile(selectedFile);
      } else {
        toast.error("Please upload a valid Excel file (.xlsx or .xls)");
        e.target.value = "";
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setResultUrl(null);
    setResultFileName("");
  };

  const handleProcess = useCallback(async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    // Check if backend is online
    if (!backendOnline) {
      toast.error("Backend server is not running. Please start the backend first.");
      return;
    }

    // Validate GST rate
    let finalGstRate: number;
    if (gstRate === "custom") {
      if (!customGstRate) {
        toast.error("Please enter a custom GST rate");
        return;
      }
      finalGstRate = parseFloat(customGstRate);
      if (isNaN(finalGstRate) || finalGstRate <= 0) {
        toast.error("Please enter a valid GST rate");
        return;
      }
    } else {
      finalGstRate = parseFloat(gstRate);
    }

    // Validate delay days
    let finalDelayDays: number;
    if (delayDays === "custom") {
      if (!customDelayDays) {
        toast.error("Please enter custom delay days");
        return;
      }
      finalDelayDays = parseInt(customDelayDays);
      if (isNaN(finalDelayDays) || finalDelayDays <= 0) {
        toast.error("Please enter a valid number of days");
        return;
      }
    } else {
      finalDelayDays = parseInt(delayDays);
    }

    setIsLoading(true);
    setResultUrl(null);
    setResultFileName("");

    try {
      const { fileUrl, fileName } = await processPaymentMatcher(file, {
        ledger_type: ledgerType,
        delay_threshold: finalDelayDays,
        gst_rate: finalGstRate,
      });

      setResultUrl(fileUrl);
      setResultFileName(fileName);
      toast.success("File processed successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process file";

      // Check if it's a network error (backend not running)
      if (errorMessage.includes("Network Error") || errorMessage.includes("Failed to fetch")) {
        setBackendOnline(false);
        toast.error("Backend server is not responding. Please start the backend and ensure CORS is configured.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [file, ledgerType, gstRate, customGstRate, delayDays, customDelayDays, backendOnline]);

  const handleDownload = () => {
    if (resultUrl) {
      const link = document.createElement("a");
      link.href = resultUrl;
      link.download = resultFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL after download
      setTimeout(() => {
        window.URL.revokeObjectURL(resultUrl);
        setResultUrl(null);
      }, 100);
    }
  };

  const getGstRateValue = () => {
    if (gstRate === "custom" && customGstRate) {
      return `${customGstRate}%`;
    }
    return `${gstRate}%`;
  };

  const getDelayDaysValue = () => {
    if (delayDays === "custom" && customDelayDays) {
      return `${customDelayDays} Days`;
    }
    return `${delayDays} Days`;
  };

  return (
    <div className="rounded-3xl bg-white p-10 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Upload Ledger</h2>
          <p className="mt-2 text-slate-500">
            Supported formats: .xlsx, .xls
          </p>
        </div>

        {/* Backend Status Indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse"></span>
          <span className={`text-sm font-medium ${backendOnline ? "text-green-600" : "text-red-600"}`}>
            {backendOnline ? "Backend: Online" : "Backend: Offline"}
          </span>
        </div>
      </div>

      {/* Backend Offline Warning */}
      {!backendOnline && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-semibold text-red-800">Backend Server Not Running</h4>
              <p className="text-sm text-red-600">
                Start your backend: <code className="bg-red-100 px-1 rounded">cd gstpoint-backend & python -m uvicorn app.main:app --reload</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className="mt-8">
        <label className="block font-semibold mb-2">Excel File</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          className="w-full rounded-xl border p-4"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        {file && (
          <div className="mt-4 flex items-center justify-between rounded-xl border bg-slate-50 p-4">
            <div>
              <h4 className="font-semibold">{file.name}</h4>
              <p className="text-sm text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleRemoveFile}
              className="rounded-lg bg-red-100 px-4 py-2 text-red-600 hover:bg-red-200 disabled:opacity-50"
              disabled={isLoading}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Ledger Type */}
      <div className="mt-8">
        <label className="font-semibold">Ledger Type</label>

        <select
          className="mt-2 w-full rounded-xl border p-3"
          value={ledgerType}
          onChange={(e) => setLedgerType(e.target.value as "single" | "multi")}
          disabled={isLoading}
        >
          <option value="single">Single Ledger</option>
          <option value="multi">Multi Ledger</option>
        </select>

        <p className="mt-2 text-sm text-slate-500">
          Single Ledger: One supplier per file. Multi Ledger: Multiple suppliers in one file.
        </p>
      </div>

      {/* GST Rate & Delay Days */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* GST Rate */}
        <div>
          <label className="font-semibold">GST Rate</label>

          <select
            className="mt-2 w-full rounded-xl border p-3"
            value={gstRate}
            onChange={(e) => setGstRate(e.target.value)}
            disabled={isLoading}
          >
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
            <option value="custom">Custom</option>
          </select>

          {gstRate === "custom" && (
            <input
              type="number"
              step="0.01"
              placeholder="Enter GST Rate (e.g., 18.5)"
              value={customGstRate}
              onChange={(e) => setCustomGstRate(e.target.value)}
              className="mt-3 w-full rounded-xl border p-3"
              disabled={isLoading}
            />
          )}
        </div>

        {/* Delay Days */}
        <div>
          <label className="font-semibold">Delay Days</label>

          <select
            className="mt-2 w-full rounded-xl border p-3"
            value={delayDays}
            onChange={(e) => setDelayDays(e.target.value)}
            disabled={isLoading}
          >
            <option value="45">45 Days</option>
            <option value="90">90 Days</option>
            <option value="180">180 Days</option>
            <option value="365">365 Days</option>
            <option value="custom">Custom</option>
          </select>

          {delayDays === "custom" && (
            <input
              type="number"
              placeholder="Enter Delay Days"
              value={customDelayDays}
              onChange={(e) => setCustomDelayDays(e.target.value)}
              className="mt-3 w-full rounded-xl border p-3"
              disabled={isLoading}
            />
          )}
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="mt-8 rounded-xl bg-slate-50 p-4">
        <h3 className="font-semibold text-slate-700 mb-2">Configuration:</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="font-medium">Type:</span>
            <span className="text-slate-600">{ledgerType === "single" ? "Single Ledger" : "Multi Ledger"}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="font-medium">GST:</span>
            <span className="text-slate-600">{getGstRateValue()}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="font-medium">Delay:</span>
            <span className="text-slate-600">{getDelayDaysValue()}</span>
          </span>
        </div>
      </div>

      {/* Process Button */}
      <button
        onClick={handleProcess}
        disabled={isLoading || !file || !backendOnline}
        className="mt-10 w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          "Process File"
        )}
      </button>

      {/* Results Display */}
      {resultUrl && (
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-green-800">Processing Complete!</h4>
                <p className="text-sm text-green-600">{resultFileName} is ready for download</p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700 transition"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5-4.5V3" />
              </svg>
              Download File
            </button>
          </div>
        </div>
      )}

      {/* Backend Instructions */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h4 className="font-semibold text-slate-700 mb-3">Need help with the backend?</h4>
        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            1. Open a new terminal
          </p>
          <p className="text-sm text-slate-600">
            2. Navigate to: <code className="bg-slate-100 px-1 rounded">C:\Users\Rahul\gstpoint-backend</code>
          </p>
          <p className="text-sm text-slate-600">
            3. Run: <code className="bg-slate-100 px-1 rounded">.\venv\Scripts\python.exe -m uvicorn app.main:app --reload</code>
          </p>
          <p className="text-sm text-slate-600">
            4. Backend will start on: <code className="bg-slate-100 px-1 rounded">http://localhost:8000</code>
          </p>
        </div>
      </div>
    </div>
  );
}
