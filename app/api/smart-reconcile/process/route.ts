import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import Decimal from "decimal.js";
import { parseGstr2bJson, flattenGstr2bToStandardInvoices } from "@/lib/smart-reconcile/gstr2b-json-converter";

// Helper normalization functions
function normalizeGstin(gstin: string): string {
  if (!gstin) return "";
  return String(gstin).trim().toUpperCase();
}

interface InvoiceAnalysis {
  original: string;
  upperTrimmed: string;
  separatorNormalized: string;
  alphaNumericOnly: string;
  numericSuffix: string;
  financialYear: string | null;
  prefix: string | null;
  tokens: string[];
}

function analyzeInvoice(invNo: string): InvoiceAnalysis {
  const original = String(invNo || "").trim();
  const upperTrimmed = original.toUpperCase();
  const separatorNormalized = upperTrimmed.replace(/[\/\-_\\.]+/g, "");
  const alphaNumericOnly = upperTrimmed.replace(/[^A-Z0-9]/g, "");

  // Extract financial year e.g. 2026-27 or 26-27
  const fyMatch = upperTrimmed.match(/(?:20)?\d{2}[-\/](?:20)?\d{2}/);
  const financialYear = fyMatch ? fyMatch[0] : null;

  // Extract prefix e.g. INV, PR
  const prefixMatch = upperTrimmed.match(/^([A-Z]+)[\/\-_]?/);
  const prefix = prefixMatch ? prefixMatch[1] : null;

  // Extract numeric suffix
  let cleanedForSuffix = upperTrimmed;
  if (prefix) cleanedForSuffix = cleanedForSuffix.replace(new RegExp(`^${prefix}[\\/\\-_]?`), "");
  if (financialYear) cleanedForSuffix = cleanedForSuffix.replace(financialYear, "").replace(/^[\/\-_]+/, "");
  const numericMatch = cleanedForSuffix.match(/\d+/) || upperTrimmed.match(/\d+$/);
  const numericSuffix = numericMatch ? numericMatch[0].replace(/^0+/, "") || "0" : "";

  const tokens = upperTrimmed.split(/[\/\-_\\.\s]+/).filter(Boolean);

  return {
    original,
    upperTrimmed,
    separatorNormalized,
    alphaNumericOnly,
    numericSuffix,
    financialYear,
    prefix,
    tokens,
  };
}

function parseDecimal(val: any): any {
  if (val === undefined || val === null || val === "") return new Decimal(0);
  const clean = String(val).replace(/,/g, "").trim();
  const num = Number(clean);
  return isNaN(num) ? new Decimal(0) : new Decimal(num);
}

function normalizeDate(val: any): string {
  if (!val) return "";
  if (typeof val === "number") {
    // Excel serial date e.g. 46238
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    if (!isNaN(dateInfo.getTime())) {
      const y = dateInfo.getUTCFullYear();
      const m = String(dateInfo.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dateInfo.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, "0");
      const d = String(val.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    } else {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return str;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const title = (formData.get("title") as string) || "Reconciliation Run - " + new Date().toLocaleDateString();
    const taxPeriod = (formData.get("taxPeriod") as string) || "Current";

    const prFile = formData.get("prFile") as File;
    const prMappingStr = formData.get("prMapping") as string;

    const gstr2bFile = formData.get("gstr2bFile") as File;
    const gstr2bMappingStr = formData.get("gstr2bMapping") as string;

    if (!prFile || !prMappingStr || !gstr2bFile || !gstr2bMappingStr) {
      return NextResponse.json({ error: "Both Purchase Register and GSTR-2B files and mappings are required" }, { status: 400 });
    }

    const prMapping = JSON.parse(prMappingStr);
    const gstr2bMapping = JSON.parse(gstr2bMappingStr);

    // Parse PR File
    const prBuffer = Buffer.from(await prFile.arrayBuffer());
    const prWb = XLSX.read(prBuffer, { type: "buffer", cellDates: true });
    const prSheet = prWb.Sheets[prWb.SheetNames[0]];
    const prRaw: any[][] = XLSX.utils.sheet_to_json(prSheet, { header: 1, defval: "" });

    // Parse GSTR-2B File (Support JSON or XLSX/CSV)
    let gstr2bRaw: any[][] = [];
    const gstr2bFileName = gstr2bFile.name.toLowerCase();
    if (gstr2bFileName.endsWith(".json")) {
      const textContent = await gstr2bFile.text();
      const jsonData = JSON.parse(textContent.replace(/^﻿/, ""));
      const extraction = parseGstr2bJson(jsonData);
      const flattenedRows = flattenGstr2bToStandardInvoices(extraction);

      if (flattenedRows.length === 0) {
        throw new Error("No invoices found in GSTR-2B JSON");
      }

      const headers = Object.keys(flattenedRows[0]);
      gstr2bRaw.push(headers);
      flattenedRows.forEach(r => gstr2bRaw.push(headers.map(h => r[h])));
    } else {
      const gstr2bBuffer = Buffer.from(await gstr2bFile.arrayBuffer());
      const gstr2bWb = XLSX.read(gstr2bBuffer, { type: "buffer", cellDates: true });
      const gstr2bSheet = gstr2bWb.Sheets[gstr2bWb.SheetNames[0]];
      gstr2bRaw = XLSX.utils.sheet_to_json(gstr2bSheet, { header: 1, defval: "" });
    }

    // Find headers
    const findHeaderRow = (data: any[][]) => {
      for (let i = 0; i < Math.min(data.length, 10); i++) {
        if (data[i].filter((c: any) => c !== "").length >= 2) return i;
      }
      return 0;
    };

    const prHeaderIdx = findHeaderRow(prRaw);
    const prHeaders = prRaw[prHeaderIdx].map((h: any) => String(h).trim());
    const prRows = prRaw.slice(prHeaderIdx + 1).filter(r => r.some(c => c !== ""));

    const gstr2bHeaderIdx = findHeaderRow(gstr2bRaw);
    const gstr2bHeaders = gstr2bRaw[gstr2bHeaderIdx].map((h: any) => String(h).trim());
    const gstr2bRows = gstr2bRaw.slice(gstr2bHeaderIdx + 1).filter(r => r.some(c => c !== ""));

    const extractRecords = (rows: any[][], headers: string[], mapping: Record<string, string>, sourceType: string) => {
      const records: any[] = [];
      rows.forEach((row, idx) => {
        const getVal = (fieldKey: string) => {
          const colName = mapping[fieldKey];
          if (!colName) return "";
          const colIdx = headers.indexOf(colName);
          if (colIdx === -1) return "";
          return row[colIdx] !== undefined ? row[colIdx] : "";
        };

        const gstin = normalizeGstin(getVal("gstin"));
        const invoiceNo = String(getVal("invoiceNo")).trim();
        if (!invoiceNo && !gstin) return; // skip empty rows

        records.push({
          sourceType,
          gstin,
          supplierName: String(getVal("supplierName") || ""),
          invoiceNo,
          normInvoiceNo: analyzeInvoice(invoiceNo).separatorNormalized,
          invoiceDate: normalizeDate(getVal("invoiceDate")),
          docType: String(getVal("docType") || "INV").toUpperCase(),
          taxableValue: parseDecimal(getVal("taxableValue")).toNumber(),
          invoiceValue: parseDecimal(getVal("invoiceValue")).toNumber(),
          igst: parseDecimal(getVal("igst")).toNumber(),
          cgst: parseDecimal(getVal("cgst")).toNumber(),
          sgst: parseDecimal(getVal("sgst")).toNumber(),
          cess: parseDecimal(getVal("cess")).toNumber(),
          gstRate: parseDecimal(getVal("gstRate")).toNumber(),
          rowNumber: prHeaderIdx + idx + 2,
          rawRowData: JSON.stringify(row),
        });
      });
      return records;
    };

    const prRecords = extractRecords(prRows, prHeaders, prMapping, "PR");
    const gstr2bRecords = extractRecords(gstr2bRows, gstr2bHeaders, gstr2bMapping, "GSTR2B");

    // Create run in database
    const run = await prisma.reconciliationRun.create({
      data: {
        userId: session.user.id,
        title,
        taxPeriod,
        status: "PROCESSING",
      },
    });

    // Save sources
    await prisma.reconciliationSource.createMany({
      data: [
        {
          runId: run.id,
          sourceType: "PR",
          filename: prFile.name,
          originalName: prFile.name,
          totalRows: prRecords.length,
          columnMapping: JSON.stringify(prMapping),
        },
        {
          runId: run.id,
          sourceType: "GSTR2B",
          filename: gstr2bFile.name,
          originalName: gstr2bFile.name,
          totalRows: gstr2bRecords.length,
          columnMapping: JSON.stringify(gstr2bMapping),
        },
      ],
    });

    // Save invoices
    const savedPrInvoices = await Promise.all(
      prRecords.map(rec =>
        prisma.reconciliationInvoice.create({
          data: { ...rec, runId: run.id },
        })
      )
    );

    const saved2bInvoices = await Promise.all(
      gstr2bRecords.map(rec =>
        prisma.reconciliationInvoice.create({
          data: { ...rec, runId: run.id },
        })
      )
    );

    // Multi-Stage Smart Matching Engine (Stages 1 to 7)
    let matchedCount = 0;
    let mismatchCount = 0;
    let onlyPrCount = 0;
    let only2bCount = 0;

    const unmatched2b = [...saved2bInvoices];
    const matchesToCreate: any[] = [];

    for (const pr of savedPrInvoices) {
      const prAnalysis = analyzeInvoice(pr.invoiceNo);
      let matched2bItem: any = null;
      let matchStatus = "ONLY_PR";
      let confidence = 1.0;
      let remarks = "Invoice present in Purchase Register but missing from GSTR-2B.";

      // Mandatory Supplier GSTIN check
      const candidate2bList = unmatched2b.filter(i => i.gstin === pr.gstin);

      if (candidate2bList.length > 0) {
        // STAGE 1: Exact invoice matching
        let found = candidate2bList.find(
          i =>
            i.invoiceNo.trim().toUpperCase() === pr.invoiceNo.trim().toUpperCase() &&
            new Decimal(i.taxableValue).minus(pr.taxableValue).abs().lte(2.0) &&
            new Decimal(i.igst).minus(pr.igst).abs().lte(2.0) &&
            new Decimal(i.cgst).minus(pr.cgst).abs().lte(2.0) &&
            new Decimal(i.sgst).minus(pr.sgst).abs().lte(2.0)
        );

        if (found) {
          matched2bItem = found;
          matchStatus = "EXACT";
          confidence = 1.0;
          remarks = "Exact match on GSTIN, Invoice Number, Taxable Value, and Tax components.";
        } else {
          // STAGE 2: Normalized invoice matching (separator-normalized)
          found = candidate2bList.find(
            i => analyzeInvoice(i.invoiceNo).separatorNormalized === prAnalysis.separatorNormalized
          );
          if (found) {
            matched2bItem = found;
            const isTaxMatch =
              new Decimal(matched2bItem.taxableValue).minus(pr.taxableValue).abs().lte(2.0) &&
              new Decimal(matched2bItem.igst).minus(pr.igst).abs().lte(2.0) &&
              new Decimal(matched2bItem.cgst).minus(pr.cgst).abs().lte(2.0) &&
              new Decimal(matched2bItem.sgst).minus(pr.sgst).abs().lte(2.0);
            matchStatus = isTaxMatch ? "NORMALIZED" : "AMOUNT_MISMATCH";
            confidence = isTaxMatch ? 0.95 : 0.8;
            remarks = isTaxMatch
              ? "Normalized match: Invoice numbers match after removing separators and case differences."
              : "Invoice numbers match after normalization, but amount or tax mismatch detected.";
          } else {
            // STAGE 3 & 4: Financial-year and serial-number matching / Prefix-independent matching
            found = candidate2bList.find(i => {
              const b2bAnalysis = analyzeInvoice(i.invoiceNo);
              const sameNumeric = b2bAnalysis.numericSuffix !== "" && b2bAnalysis.numericSuffix === prAnalysis.numericSuffix;
              const sameFy = !b2bAnalysis.financialYear || !prAnalysis.financialYear || b2bAnalysis.financialYear === prAnalysis.financialYear;
              return sameNumeric && sameFy;
            });

            if (found) {
              matched2bItem = found;
              const isTaxMatch = new Decimal(matched2bItem.taxableValue).eq(pr.taxableValue);
              matchStatus = isTaxMatch ? "PROBABLE" : "AMOUNT_MISMATCH";
              confidence = 0.85;
              remarks = "Invoice serial number matches after removing prefix, financial year and leading zeros. Supplier GSTIN and financial amounts also agree.";
            } else {
              // STAGE 5 & 6: Fuzzy / Tax corroboration matching
              found = candidate2bList.find(i => {
                const b2bAnalysis = analyzeInvoice(i.invoiceNo);
                const hasTokenOverlap = b2bAnalysis.tokens.some(t => prAnalysis.tokens.includes(t));
                const exactTax = new Decimal(i.taxableValue).eq(pr.taxableValue) && new Decimal(i.igst).eq(pr.igst);
                return (hasTokenOverlap || exactTax);
              });

              if (found) {
                matched2bItem = found;
                matchStatus = "PROBABLE";
                confidence = 0.75;
                remarks = "Probable match identified via token similarity and tax corroboration.";
              }
            }
          }
        }
      }

      if (matched2bItem) {
        const idx = unmatched2b.findIndex(i => i.id === matched2bItem.id);
        if (idx !== -1) unmatched2b.splice(idx, 1);

        if (matchStatus === "EXACT" || matchStatus === "NORMALIZED") {
          matchedCount++;
        } else {
          mismatchCount++;
        }

        matchesToCreate.push({
          runId: run.id,
          matchStatus,
          prInvoiceId: pr.id,
          gstr2bInvoiceId: matched2bItem.id,
          confidence,
          reviewStatus: matchStatus === "EXACT" ? "ACCEPTED" : "PENDING",
          remarks,
        });
      } else {
        onlyPrCount++;
        matchesToCreate.push({
          runId: run.id,
          matchStatus: "ONLY_PR",
          prInvoiceId: pr.id,
          gstr2bInvoiceId: null,
          confidence: 1.0,
          reviewStatus: "PENDING",
          remarks: "Invoice present in Purchase Register but missing from GSTR-2B.",
        });
      }
    }

    // Remaining in GSTR-2B
    for (const b2b of unmatched2b) {
      only2bCount++;
      matchesToCreate.push({
        runId: run.id,
        matchStatus: "ONLY_2B",
        prInvoiceId: null,
        gstr2bInvoiceId: b2b.id,
        confidence: 1.0,
        reviewStatus: "PENDING",
        remarks: "Invoice present in GSTR-2B but missing from Purchase Register.",
      });
    }

    // Save matches in bulk
    await prisma.reconciliationMatch.createMany({
      data: matchesToCreate,
    });

    // Update run status
    await prisma.reconciliationRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        totalMatched: matchedCount,
        totalMismatch: mismatchCount,
        totalOnlyPr: onlyPrCount,
        totalOnly2b: only2bCount,
      },
    });

    return NextResponse.json({
      success: true,
      runId: run.id,
      stats: {
        matchedCount,
        mismatchCount,
        onlyPrCount,
        only2bCount,
      },
    });
  } catch (error: any) {
    console.error("Reconciliation process error:", error);
    return NextResponse.json({ error: error.message || "Failed to process reconciliation" }, { status: 500 });
  }
}
