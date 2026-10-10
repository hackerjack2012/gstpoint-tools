import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const runId = searchParams.get("runId");

    if (!runId) {
      return NextResponse.json({ error: "Missing runId parameter" }, { status: 400 });
    }

    const run = await prisma.reconciliationRun.findUnique({
      where: { id: runId },
      include: {
        matches: true,
        sources: true,
        invoices: true,
      },
    });

    if (!run || run.userId !== session.user.id) {
      return NextResponse.json({ error: "Reconciliation run not found" }, { status: 404 });
    }

    const invoiceMap = new Map(run.invoices.map(inv => [inv.id, inv]));

    // Prepare data sheets
    const summaryData = [
      ["GSTPoint Smart Reconcile - Executive Summary"],
      ["Run Title", run.title],
      ["Tax Period", run.taxPeriod || "N/A"],
      ["Generated At", new Date().toLocaleString()],
      [""],
      ["Metric", "Count"],
      ["Fully Matched / Normalized", run.totalMatched],
      ["Amount / Tax Mismatches", run.totalMismatch],
      ["Only in Purchase Register", run.totalOnlyPr],
      ["Only in GSTR-2B", run.totalOnly2b],
    ];

    const matchedRows: any[] = [];
    const mismatchRows: any[] = [];
    const onlyPrRows: any[] = [];
    const only2bRows: any[] = [];

    run.matches.forEach(m => {
      const pr = m.prInvoiceId ? invoiceMap.get(m.prInvoiceId) : null;
      const b2b = m.gstr2bInvoiceId ? invoiceMap.get(m.gstr2bInvoiceId) : null;

      const row = {
        "Match Status": m.matchStatus,
        "Review Status": m.reviewStatus,
        "Supplier GSTIN": pr?.gstin || b2b?.gstin || "",
        "Supplier Name": pr?.supplierName || b2b?.supplierName || "",
        "PR Invoice No": pr?.invoiceNo || "",
        "PR Invoice Date": pr?.invoiceDate || "",
        "PR Taxable Value": pr?.taxableValue || 0,
        "PR IGST": pr?.igst || 0,
        "PR CGST": pr?.cgst || 0,
        "PR SGST": pr?.sgst || 0,
        "2B Invoice No": b2b?.invoiceNo || "",
        "2B Invoice Date": b2b?.invoiceDate || "",
        "2B Taxable Value": b2b?.taxableValue || 0,
        "2B IGST": b2b?.igst || 0,
        "2B CGST": b2b?.cgst || 0,
        "2B SGST": b2b?.sgst || 0,
        "Remarks": m.remarks || "",
      };

      if (m.matchStatus === "EXACT" || m.matchStatus === "NORMALIZED") {
        matchedRows.push(row);
      } else if (m.matchStatus === "AMOUNT_MISMATCH" || m.matchStatus === "TAX_MISMATCH") {
        mismatchRows.push(row);
      } else if (m.matchStatus === "ONLY_PR") {
        onlyPrRows.push(row);
      } else if (m.matchStatus === "ONLY_2B") {
        only2bRows.push(row);
      }
    });

    const workbook = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, "Summary");

    if (matchedRows.length > 0) {
      const wsMatched = XLSX.utils.json_to_sheet(matchedRows);
      XLSX.utils.book_append_sheet(workbook, wsMatched, "Matched Invoices");
    }

    if (mismatchRows.length > 0) {
      const wsMismatch = XLSX.utils.json_to_sheet(mismatchRows);
      XLSX.utils.book_append_sheet(workbook, wsMismatch, "Amount Mismatches");
    }

    if (onlyPrRows.length > 0) {
      const wsOnlyPr = XLSX.utils.json_to_sheet(onlyPrRows);
      XLSX.utils.book_append_sheet(workbook, wsOnlyPr, "Only in PR");
    }

    if (only2bRows.length > 0) {
      const wsOnly2b = XLSX.utils.json_to_sheet(only2bRows);
      XLSX.utils.book_append_sheet(workbook, wsOnly2b, "Only in GSTR-2B");
    }

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Reconciliation_${run.title.replace(/\s+/g, "_")}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: any) {
    console.error("Export reconciliation error:", error);
    return NextResponse.json({ error: error.message || "Failed to export reconciliation report" }, { status: 500 });
  }
}
