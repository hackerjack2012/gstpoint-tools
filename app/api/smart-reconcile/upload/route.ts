import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sourceType = (formData.get("sourceType") as string) || "PR";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      return NextResponse.json({ error: "Uploaded spreadsheet contains no sheets" }, { status: 400 });
    }

    const defaultSheet = sheetNames[0];
    const worksheet = workbook.Sheets[defaultSheet];

    // Convert to JSON with raw headers
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    if (rawData.length === 0) {
      return NextResponse.json({ error: "Uploaded spreadsheet is empty" }, { status: 400 });
    }

    // Find header row (default to row 1, index 0)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i];
      const nonEmpCount = row.filter((cell: any) => cell !== "").length;
      if (nonEmpCount >= 2) {
        headerRowIndex = i;
        break;
      }
    }

    const headers: string[] = rawData[headerRowIndex].map((h: any, idx: number) =>
      h !== "" ? String(h).trim() : `Column_${idx + 1}`
    );

    const rows = rawData.slice(headerRowIndex + 1).filter(row => row.some((c: any) => c !== ""));

    // Preview first 20 rows
    const previewRows = rows.slice(0, 20).map((row, rIdx) => {
      const obj: Record<string, any> = { _rowNumber: headerRowIndex + rIdx + 2 };
      headers.forEach((h, cIdx) => {
        obj[h] = row[cIdx] !== undefined ? row[cIdx] : "";
      });
      return obj;
    });

    // Auto-suggest mapping based on aliases
    const autoMapping: Record<string, string> = {};
    const lowerHeaders = headers.map(h => h.toLowerCase());

    const findBestHeader = (aliases: string[]) => {
      for (const alias of aliases) {
        const idx = lowerHeaders.findIndex(h => h.includes(alias));
        if (idx !== -1) return headers[idx];
      }
      return "";
    };

    autoMapping.gstin = findBestHeader(["gstin", "gst no", "supplier gstin", "party gstin"]);
    autoMapping.supplierName = findBestHeader(["supplier name", "party name", "trade name", "name", "vendor"]);
    autoMapping.invoiceNo = findBestHeader(["invoice no", "inv no", "bill no", "voucher no", "invoice number"]);
    autoMapping.invoiceDate = findBestHeader(["invoice date", "inv date", "date", "bill date"]);
    autoMapping.docType = findBestHeader(["document type", "doc type", "type", "nature"]);
    autoMapping.taxableValue = findBestHeader(["taxable value", "taxable amount", "assessable value"]);
    autoMapping.invoiceValue = findBestHeader(["invoice value", "total value", "grand total", "net total", "amount"]);
    autoMapping.igst = findBestHeader(["igst", "integrated tax"]);
    autoMapping.cgst = findBestHeader(["cgst", "central tax"]);
    autoMapping.sgst = findBestHeader(["sgst", "sgst/utgst", "state tax"]);
    autoMapping.cess = findBestHeader(["cess"]);
    autoMapping.gstRate = findBestHeader(["rate", "gst %", "tax rate"]);
    autoMapping.returnPeriod = findBestHeader(["return period", "period", "month"]);

    return NextResponse.json({
      success: true,
      filename: file.name,
      sheetNames,
      selectedSheet: defaultSheet,
      headers,
      totalRows: rows.length,
      previewRows,
      autoMapping,
    });
  } catch (error: any) {
    console.error("Upload & parse error:", error);
    return NextResponse.json({ error: error.message || "Failed to process upload" }, { status: 500 });
  }
}
