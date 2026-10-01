"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { processBulkSearch, checkBackendHealth } from "@/lib/api-client";
import { FileText, Upload, FileSpreadsheet, Download, Loader2, Trash2 } from "lucide-react";
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
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight">Return Filing Checker</h1>
            <p className="text-muted-foreground mt-2">
              Check filing status of GSTR-1 and GSTR-3B for multiple GSTINs simultaneously across financial years and periods.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">GSTR-1 & GSTR-3B Return Filing Status</h2>
                <p className="text-sm text-muted-foreground">
                  Select period parameters and provide GSTINs via text or file upload.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Return Filing Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border border-border">
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Financial Year
                  </label>
                  <select
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Period / Month
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Return Type
                  </label>
                  <select
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Both">Both (GSTR-1 & 3B)</option>
                    <option value="GSTR-1">GSTR-1 Only</option>
                    <option value="GSTR-3B">GSTR-3B Only</option>
                  </select>
                </div>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter GSTINs (One per line)
                </label>
                <textarea
                  rows={5}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="27AAAAA0000A1Z5&#10;07AAAAA0000A1Z6"
                  value={gstinsText}
                  onChange={(e) => setGstinsText(e.target.value)}
                />
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase">Or Upload File</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              {/* File Upload */}
              <div>
                {!file ? (
                  <label className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">Upload Excel or CSV containing GSTIN column</span>
                    <span className="text-xs text-muted-foreground mt-1">Supports .xlsx, .xls, .csv</span>
                    <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-6 h-6 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Progress Section during loading */}
              {isLoading && (
                <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-3 animate-pulse">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      {progressStatus}
                    </span>
                    <span className="text-primary font-bold">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <ProgressTrack className="h-full bg-muted">
                      <ProgressIndicator className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                    </ProgressTrack>
                  </Progress>
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={handleProcess}
                disabled={isLoading || (!file && !gstinsText.trim())}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking Return Filing Status ({progress}%)...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Check Return Filing Status
                  </>
                )}
              </button>

              {/* Result Download */}
              {resultUrl && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between mt-4">
                  <div>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">Report Ready!</p>
                    <p className="text-xs text-muted-foreground">{resultFileName}</p>
                  </div>
                  <a
                    href={resultUrl}
                    download={resultFileName}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Report
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
