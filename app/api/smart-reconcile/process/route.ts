import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import Decimal from "decimal.js";

// Helper normalization functions
function normalizeGstin(gstin: string): string {
  if (!gstin) return "";
  return String(gstin).trim().toUpperCase();
}

function normalizeInvoiceNo(invNo: string): string {
  if (!invNo) return "";
  return String(invNo).trim().toUpperCase().replace(/[\/\-_\\.]+/g, "");
}

function parseDecimal(val: any): any {
  if (val === undefined || val === null || val === "") return new Decimal(0);
  const clean = String(val).replace(/,/g, "").trim();
  const num = Number(clean);
  return isNaN(num) ? new Decimal(0) : new Decimal(num);
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
      const jsonData = JSON.parse(textContent);
      let flattenedRows: any[] = [];
      const parseInvoices = (invoices: any[], gstin: string, supplierName: string, docTypeDefault: string) => {
        if (!Array.isArray(invoices)) return;
        invoices.forEach((inv: any) => {
          const invoiceNo = inv.inum || inv.invoice_no || inv.inv_num || inv.note_num || "";
          const invoiceDate = inv.idt || inv.invoice_date || inv.dt || inv.note_dt || "";
          const taxableValue = Number(inv.val || inv.taxable_value || inv.txval || 0);
          const invoiceValue = Number(inv.val || inv.tot_val || taxableValue);
          const docType = inv.typ || inv.doc_type || docTypeDefault;

          let igst = 0, cgst = 0, sgst = 0, cess = 0, gstRate = 0;
          const items = inv.itms || inv.items || [];
          if (Array.isArray(items) && items.length > 0) {
            items.forEach((item: any) => {
              const itemDetails = item.itm_det || item;
              igst += Number(itemDetails.iamt || itemDetails.igst || 0);
              cgst += Number(itemDetails.camt || itemDetails.cgst || 0);
              sgst += Number(itemDetails.samt || itemDetails.sgst || 0);
              cess += Number(itemDetails.csamt || itemDetails.cess || 0);
              gstRate = Number(itemDetails.rt || itemDetails.rate || gstRate);
            });
          } else {
            igst = Number(inv.igst || inv.iamt || 0);
            cgst = Number(inv.cgst || inv.camt || 0);
            sgst = Number(inv.sgst || inv.samt || 0);
            cess = Number(inv.cess || inv.csamt || 0);
            gstRate = Number(inv.rt || inv.rate || 0);
          }

          flattenedRows.push({
            "GSTIN": gstin,
            "Supplier Name": supplierName,
            "Invoice Number": invoiceNo,
            "Invoice Date": invoiceDate,
            "Document Type": docType,
            "Taxable Value": taxableValue,
            "Invoice Value": invoiceValue,
            "IGST": igst,
            "CGST": cgst,
            "SGST": sgst,
            "Cess": cess,
            "GST Rate": gstRate,
            "Return Period": jsonData.ret_period || jsonData.fp || "",
          });
        });
      };

      // 1. B2B Invoices
      const b2bSuppliers = jsonData.b2b || jsonData.data?.b2b || [];
      if (Array.isArray(b2bSuppliers)) {
        b2bSuppliers.forEach((supplier: any) => {
          const gstin = supplier.ctin || supplier.gstin || "";
          const supplierName = supplier.cname || supplier.trade_name || supplier.sup_name || "";
          parseInvoices(supplier.inv || supplier.invoices || [], gstin, supplierName, "INV");
        });
      }

      // 2. B2BA
      const b2baSuppliers = jsonData.b2ba || jsonData.data?.b2ba || [];
      if (Array.isArray(b2baSuppliers)) {
        b2baSuppliers.forEach((supplier: any) => {
          const gstin = supplier.ctin || supplier.gstin || "";
          const supplierName = supplier.cname || supplier.trade_name || supplier.sup_name || "";
          parseInvoices(supplier.inv || supplier.invoices || [], gstin, supplierName, "INV-A");
        });
      }

      // 3. CDNR
      const cdnrSuppliers = jsonData.cdnr || jsonData.data?.cdnr || [];
      if (Array.isArray(cdnrSuppliers)) {
        cdnrSuppliers.forEach((supplier: any) => {
          const gstin = supplier.ctin || supplier.gstin || "";
          const supplierName = supplier.cname || supplier.trade_name || supplier.sup_name || "";
          parseInvoices(supplier.nt || supplier.notes || [], gstin, supplierName, "CRN");
        });
      }

      // 4. CDNRA
      const cdnraSuppliers = jsonData.cdnra || jsonData.data?.cdnra || [];
      if (Array.isArray(cdnraSuppliers)) {
        cdnraSuppliers.forEach((supplier: any) => {
          const gstin = supplier.ctin || supplier.gstin || "";
          const supplierName = supplier.cname || supplier.trade_name || supplier.sup_name || "";
          parseInvoices(supplier.nt || supplier.notes || [], gstin, supplierName, "CRN-A");
        });
      }

      if (flattenedRows.length === 0) {
        flattenedRows.push({
          "GSTIN": jsonData.gstin || "",
          "Supplier Name": jsonData.name || "",
          "Invoice Number": jsonData.invoiceNo || "",
          "Invoice Date": jsonData.invoiceDate || "",
          "Taxable Value": jsonData.taxableValue || 0,
          "Invoice Value": jsonData.invoiceValue || 0,
          "IGST": jsonData.igst || 0,
          "CGST": jsonData.cgst || 0,
          "SGST": jsonData.sgst || 0,
        });
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
          normInvoiceNo: normalizeInvoiceNo(invoiceNo),
          invoiceDate: String(getVal("invoiceDate") || ""),
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

    // Matching Engine
    let matchedCount = 0;
    let mismatchCount = 0;
    let onlyPrCount = 0;
    let only2bCount = 0;

    const unmatched2b = [...saved2bInvoices];
    const matchesToCreate: any[] = [];

    for (const pr of savedPrInvoices) {
      // Stage A: Exact Match
      const exactIdx = unmatched2b.findIndex(
        i =>
          i.gstin === pr.gstin &&
          i.normInvoiceNo === pr.normInvoiceNo &&
          new Decimal(i.taxableValue).eq(pr.taxableValue) &&
          new Decimal(i.igst).eq(pr.igst) &&
          new Decimal(i.cgst).eq(pr.cgst) &&
          new Decimal(i.sgst).eq(pr.sgst)
      );

      if (exactIdx !== -1) {
        const match2b = unmatched2b.splice(exactIdx, 1)[0];
        matchesToCreate.push({
          runId: run.id,
          matchStatus: "EXACT",
          prInvoiceId: pr.id,
          gstr2bInvoiceId: match2b.id,
          confidence: 1.0,
          reviewStatus: "ACCEPTED",
          remarks: "Exact match on GSTIN, Invoice No, Taxable Value, and Tax components.",
        });
        matchedCount++;
        continue;
      }

      // Stage B: Normalized / Amount Mismatch Match
      const normIdx = unmatched2b.findIndex(
        i => i.gstin === pr.gstin && i.normInvoiceNo === pr.normInvoiceNo
      );

      if (normIdx !== -1) {
        const match2b = unmatched2b.splice(normIdx, 1)[0];
        const isTaxMatch =
          new Decimal(match2b.taxableValue).eq(pr.taxableValue) &&
          new Decimal(match2b.igst).eq(pr.igst) &&
          new Decimal(match2b.cgst).eq(pr.cgst) &&
          new Decimal(match2b.sgst).eq(pr.sgst);

        const status = isTaxMatch ? "NORMALIZED" : "AMOUNT_MISMATCH";
        if (isTaxMatch) matchedCount++;
        else mismatchCount++;

        matchesToCreate.push({
          runId: run.id,
          matchStatus: status,
          prInvoiceId: pr.id,
          gstr2bInvoiceId: match2b.id,
          confidence: isTaxMatch ? 0.95 : 0.8,
          reviewStatus: "PENDING",
          discrepancies: JSON.stringify({
            prTaxable: pr.taxableValue,
            b2bTaxable: match2b.taxableValue,
            prIgst: pr.igst,
            b2bIgst: match2b.igst,
          }),
          remarks: isTaxMatch ? "Matched via normalized invoice number." : "Invoice matched but amount/tax mismatch detected.",
        });
        continue;
      }

      // Only in Purchase Register
      matchesToCreate.push({
        runId: run.id,
        matchStatus: "ONLY_PR",
        prInvoiceId: pr.id,
        gstr2bInvoiceId: null,
        confidence: 1.0,
        reviewStatus: "PENDING",
        remarks: "Invoice present in Purchase Register but missing from GSTR-2B.",
      });
      onlyPrCount++;
    }

    // Remaining in GSTR-2B
    for (const b2b of unmatched2b) {
      matchesToCreate.push({
        runId: run.id,
        matchStatus: "ONLY_2B",
        prInvoiceId: null,
        gstr2bInvoiceId: b2b.id,
        confidence: 1.0,
        reviewStatus: "PENDING",
        remarks: "Invoice present in GSTR-2B but missing from Purchase Register.",
      });
      only2bCount++;
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
