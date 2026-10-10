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

    // Read buffer or JSON
    let rawData: any[][] = [];
    let fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "json") {
      try {
        const textContent = await file.text();
        const jsonData = JSON.parse(textContent);

        // GSTR-2B JSON structure parsing from GST Portal:
        // Usually contains b2b array with supplier gstin (ctin), invoices (inv), items, etc.
        // Let's flatten GSTR-2B JSON into tabular rows for uniform mapping.
        let flattenedRows: any[] = [];

        // Handle standard GSTR-2B JSON formats
        const b2bSuppliers = jsonData.b2b || jsonData.data?.b2b || [];
        if (Array.isArray(b2bSuppliers)) {
          b2bSuppliers.forEach((supplier: any) => {
            const gstin = supplier.ctin || supplier.gstin || "";
            const supplierName = supplier.cname || supplier.trade_name || supplier.sup_name || "";
            const invoices = supplier.inv || supplier.invoices || [];

            if (Array.isArray(invoices)) {
              invoices.forEach((inv: any) => {
                const invoiceNo = inv.inum || inv.invoice_no || inv.inv_num || "";
                const invoiceDate = inv.idt || inv.invoice_date || inv.dt || "";
                const taxableValue = inv.val || inv.taxable_value || inv.txval || 0;
                const invoiceValue = inv.val || inv.tot_val || 0;
                const docType = inv.typ || inv.doc_type || "INV";

                // tax items
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
            }
          });
        }

        if (flattenedRows.length === 0) {
          // If flat structure or fallback
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

        // Convert flattenedRows to rawData array format
        const headers = Object.keys(flattenedRows[0]);
        rawData.push(headers);
        flattenedRows.forEach(r => {
          rawData.push(headers.map(h => r[h]));
        });
      } catch (jsonErr: any) {
        return NextResponse.json({ error: "Invalid GSTR-2B JSON file format: " + jsonErr.message }, { status: 400 });
      }
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

      const sheetNames = workbook.SheetNames;
      if (sheetNames.length === 0) {
        return NextResponse.json({ error: "Uploaded spreadsheet contains no sheets" }, { status: 400 });
      }

      const defaultSheet = sheetNames[0];
      const worksheet = workbook.Sheets[defaultSheet];
      rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    }

    if (rawData.length === 0) {
      return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
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

    autoMapping.gstin = findBestHeader(["gstin", "gst no", "supplier gstin", "party gstin", "ctin"]);
    autoMapping.supplierName = findBestHeader(["supplier name", "party name", "trade name", "name", "vendor", "cname"]);
    autoMapping.invoiceNo = findBestHeader(["invoice no", "inv no", "bill no", "voucher no", "invoice number", "inum"]);
    autoMapping.invoiceDate = findBestHeader(["invoice date", "inv date", "date", "bill date", "idt"]);
    autoMapping.docType = findBestHeader(["document type", "doc type", "type", "nature", "typ"]);
    autoMapping.taxableValue = findBestHeader(["taxable value", "taxable amount", "assessable value", "val", "txval"]);
    autoMapping.invoiceValue = findBestHeader(["invoice value", "total value", "grand total", "net total", "amount", "tot_val"]);
    autoMapping.igst = findBestHeader(["igst", "integrated tax", "iamt"]);
    autoMapping.cgst = findBestHeader(["cgst", "central tax", "camt"]);
    autoMapping.sgst = findBestHeader(["sgst", "sgst/utgst", "state tax", "samt"]);
    autoMapping.cess = findBestHeader(["cess", "csamt"]);
    autoMapping.gstRate = findBestHeader(["rate", "gst %", "tax rate", "rt"]);
    autoMapping.returnPeriod = findBestHeader(["return period", "period", "month", "ret_period", "fp"]);

    return NextResponse.json({
      success: true,
      filename: file.name,
      sheetNames: fileExtension === "json" ? ["GSTR2B_JSON"] : XLSX.read(await file.arrayBuffer(), { type: "buffer" }).SheetNames,
      selectedSheet: fileExtension === "json" ? "GSTR2B_JSON" : XLSX.read(await file.arrayBuffer(), { type: "buffer" }).SheetNames[0],
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
