"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import { ArrowLeft, Download, HelpCircle } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { processBulkSearch, checkBackendHealth } from "@/lib/api-client";
import { FileText, Upload, FileSpreadsheet, Loader2, Trash2 } from "lucide-react";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";

export default function FilingCheckerPage() {
  const [financialYear, setFinancialYear] = useState<string>("2024-25");
  const [month, setMonth] = useState<string>("All");
  const [returnType, setReturnType] = useState<string>("Both");

  const [gstinsText, setGstinsText] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setProgress(10);
      setProgressStatus("Initializing and validating GSTIN list...");

      timer = setTimeout(() => {
        setProgress(35);
        setProgressStatus("Fetching Return Filing Status & GSTR Data...");
      }, 1500);

      const timer2 = setTimeout(() => {
        setProgress(70);
        setProgressStatus("Filtering Returns by Period and Type...");
      }, 4000);

      const timer3 = setTimeout(() => {
        setProgress(90);
        setProgressStatus("Generating styled Excel report with openpyxl...");
      }, 8000);

      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setProgress(0);
      setProgressStatus("");
    }
  }, [isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv"
      ];
      const validExtensions = [".xlsx", ".xls", ".csv"];

      const isValidType = validTypes.includes(selectedFile.type);
      const isValidExtension = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));

      if (isValidType || isValidExtension) {
        setFile(selectedFile);
        toast.success(`Loaded file: ${selectedFile.name}`);
      } else {
        toast.error("Please upload a valid Excel or CSV file (.xlsx, .xls, .csv)");
        e.target.value = "";
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleProcess = useCallback(async () => {
    if (!file && !gstinsText.trim()) {
      toast.error("Please either upload a file or enter GSTINs in the text box");
      return;
    }

    const isOnline = await checkBackendHealth();
    if (!isOnline) {
      toast.error("Backend server is not responding. Please try again later.");
      return;
    }

    setIsLoading(true);
    setResultUrl(null);
    setResultFileName("");

    try {
      const { fileUrl, fileName } = await processBulkSearch(
        file || undefined,
        gstinsText.trim() || undefined,
        "return",
        financialYear,
        month,
        returnType
      );
      setProgress(100);
      setProgressStatus("Complete!");
      setResultUrl(fileUrl);
      setResultFileName(fileName);
      toast.success("GSTR Filing Status search completed successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process return filing check";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [file, gstinsText, financialYear, month, returnType]);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <a
              href="/samples/gstins_template.csv"
              download="gstins_template.csv"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4 text-blue-600" /> Download Sample GSTINs (.csv)
            </a>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Return Filing Checker</h1>
            <p className="text-slate-600 mt-2 text-lg">
              Check filing status of GSTR-1 and GSTR-3B for multiple GSTINs simultaneously across financial years and periods.
            </p>
          </div>

          {/* How It Works Section */}
          <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" /> How Return Filing Checker Works
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">1</div>
                <h3 className="font-bold text-slate-900 mb-2">Select Parameters</h3>
                <p className="text-sm text-slate-600">
                  Choose the Financial Year, specific Month/Period, and Return Type (GSTR-1, GSTR-3B, or Both).
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm mb-3">2</div>
                <h3 className="font-bold text-slate-900 mb-2">Provide GSTINs</h3>
                <p className="text-sm text-slate-600">
                  Enter GSTINs in the text area (one per line) or upload a CSV/Excel file with a <strong className="text-slate-800">GSTIN</strong> column.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm mb-3">3</div>
                <h3 className="font-bold text-slate-900 mb-2">Export Compliance Report</h3>
                <p className="text-sm text-slate-600">
                  Generate and download a structured Excel report highlighting filed vs pending returns for all queried entities.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">GSTR-1 & GSTR-3B Return Filing Status</h2>
                <p className="text-sm text-slate-600">
                  Select period parameters and provide GSTINs via text or file upload.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Return Filing Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Financial Year
                  </label>
                  <select
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="2027-28">2027-28</option>
                    <option value="2026-27">2026-27</option>
                    <option value="2025-26">2025-26</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2023-24">2023-24</option>
                    <option value="2022-23">2022-23</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Period / Month
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="All">All Months / Periods</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Return Type
                  </label>
                  <select
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Both">Both (GSTR-1 & 3B)</option>
                    <option value="GSTR-1">GSTR-1 Only</option>
                    <option value="GSTR-3B">GSTR-3B Only</option>
                  </select>
                </div>
              </div>

              {/* Input Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Enter GSTINs (One per line)
                  </label>
                  <textarea
                    rows={6}
                    value={gstinsText}
                    onChange={(e) => setGstinsText(e.target.value)}
                    placeholder="29AABCA1234F1Z5&#10;27AAACX9876K1Z9"
                    className="w-full rounded-2xl border border-slate-300 p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Or Upload File (.xlsx, .xls, .csv)
                  </label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 transition h-[174px] bg-slate-50/50">
                    {file ? (
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-8 h-8 text-green-600" />
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-900">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          onClick={handleRemoveFile}
                          className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center">
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm font-semibold text-slate-700">Click to upload spreadsheet</span>
                        <span className="text-xs text-slate-500 mt-1">XLSX, XLS, CSV (max 10MB)</span>
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {isLoading && (
                <div className="space-y-2 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex justify-between text-sm font-medium text-blue-900">
                    <span>{progressStatus}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2">
                    <ProgressTrack>
                      <ProgressIndicator />
                    </ProgressTrack>
                  </Progress>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setGstinsText("");
                    setFile(null);
                    setResultUrl(null);
                  }}
                  className="px-6 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  Clear Form
                </button>

                {resultUrl ? (
                  <a
                    href={resultUrl}
                    download={resultFileName || "Return_Filing_Report.xlsx"}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 font-bold text-white shadow-lg shadow-green-600/20 hover:bg-green-700 transition"
                  >
                    <Download className="w-5 h-5" /> Download Report (.xlsx)
                  </a>
                ) : (
                  <button
                    onClick={handleProcess}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {isLoading ? "Checking Filing Status..." : "Check Filing Status"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
