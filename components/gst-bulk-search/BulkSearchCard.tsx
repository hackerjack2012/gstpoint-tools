"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { processBulkSearch, checkBackendHealth } from "@/lib/api-client";
import { Search, Upload, FileSpreadsheet, Download, Loader2, Trash2 } from "lucide-react";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";

export default function BulkSearchCard() {
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
        setProgressStatus("Connecting to GST Portal & Solving CAPTCHA...");
      }, 1500);

      const timer2 = setTimeout(() => {
        setProgress(70);
        setProgressStatus("Retrieving Taxpayer Details & HSN Codes...");
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
        "taxpayer"
      );
      setProgress(100);
      setProgressStatus("Complete!");
      setResultUrl(fileUrl);
      setResultFileName(fileName);
      toast.success("GST Bulk Taxpayer Search completed successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process bulk search";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [file, gstinsText]);

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg text-primary">
          <Search className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Bulk Taxpayer Details Search</h2>
          <p className="text-sm text-muted-foreground">
            Query taxpayer legal name, status, jurisdiction, principal place of business, and HSN codes.
          </p>
        </div>
      </div>

      <div className="space-y-6">
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
              Processing Taxpayer Search ({progress}%)...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Run Bulk Taxpayer Search
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
  );
}
