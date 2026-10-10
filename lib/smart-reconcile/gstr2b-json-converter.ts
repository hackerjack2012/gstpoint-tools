/**
 * GSTR-2B JSON Converter extracted directly from GSTPoint_2B_JSON_to_Excel.html
 * Converts official GSTR-2B JSON portal exports into structured sheets (B2B, CDNR, etc.)
 */

export interface Gstr2bSheet {
  name: string;
  heads: string[];
  rows: any[][];
  dateCols: number[];
  moneyCols: number[];
}

export interface Gstr2bExtractionResult {
  sheets: Gstr2bSheet[];
  d: any;
  extra: string[];
}

export function parseGstr2bJson(input: any): Gstr2bExtractionResult {
  const d = input.data || input;
  if (!d.docdata || typeof d.docdata !== "object") {
    throw new Error("Unsupported JSON: expected GSTR-2B data.docdata.");
  }

  const sheets: Gstr2bSheet[] = [];
  const extra: string[] = [];
  const base = [
    "Sr. No.",
    "Supplier GSTIN",
    "Supplier Trade Name",
    "Invoice Number",
    "Invoice Date",
    "Invoice Type",
    "Invoice Value (Rs.)",
    "Taxable Value (Rs.)",
    "IGST (Rs.)",
    "CGST (Rs.)",
    "SGST/UTGST (Rs.)",
    "Cess (Rs.)",
    "Place of Supply Code",
    "Reverse Charge",
    "ITC Availability",
    "ITC Unavailability Reason",
    "Supplier Return Period",
    "Supplier Filing Date",
    "IMS Status",
    "Recipient GSTIN",
    "GSTR-2B Period",
  ];

  const date = (v: any) => {
    if (!v) return "";
    const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(v);
    if (!m) return v; // return original if format differs slightly
    const t = Date.UTC(+m[3], +m[2] - 1, +m[1]);
    const check = new Date(t);
    if (check.getUTCDate() !== +m[1] || check.getUTCMonth() !== +m[2] - 1) {
      return v;
    }
    return (t - Date.UTC(1899, 11, 30)) / 86400000;
  };

  const num = (v: any) => {
    if (v === undefined || v === null || v === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const yn = (v: any) => (v === "Y" ? "Yes" : v === "N" ? "No" : v || "");

  function section(container: any, key: string, name: string, note: boolean) {
    const groups = container?.[key] || [];
    if (!Array.isArray(groups)) return;
    const heads = base.slice();
    if (note) {
      heads[3] = "Note Number";
      heads[4] = "Note Date";
      heads[5] = "Note Type";
      heads[6] = "Note Value (Rs.)";
      heads.push("Supply Type", "ITC Reduction Required");
    }
    const rows: any[][] = [];
    for (const s of groups) {
      const docs = s[note ? "nt" : "inv"];
      if (!Array.isArray(docs)) continue;
      for (const v of docs) {
        let money = v;
        if (Array.isArray(v.items)) {
          money = { ...v };
          for (const k of ["txval", "igst", "cgst", "sgst", "cess"]) {
            const vals = v.items.map((x: any) => x[k]).filter((x: any) => x != null);
            if (v[k] == null && vals.length) {
              money[k] = vals.reduce((a: number, x: any) => a + num(x), 0);
            }
          }
        }
        const row = [
          rows.length + 1,
          s.ctin || "",
          s.trdnm || s.trdnam || "",
          String(v[note ? "ntnum" : "inum"] ?? ""),
          date(v.dt),
          note
            ? (({ C: "Credit Note", D: "Debit Note" } as Record<string, string>)[v.typ] || v.typ || "")
            : (({ R: "Regular", SEWP: "SEZ with payment", SEWOP: "SEZ without payment", DE: "Deemed export" } as Record<string, string>)[v.typ] || v.typ || ""),
          ...["val", "txval", "igst", "cgst", "sgst", "cess"].map((k) => num(money[k])),
          String(v.pos ?? ""),
          yn(v.rev),
          yn(v.itcavl),
          v.rsn || "",
          s.supprd || "",
          date(s.supfildt),
          v.imsStatus || "",
          d.gstin || "",
          d.rtnprd || "",
        ];
        if (note) row.push(v.suptyp || "", yn(v.itcRedReq));
        rows.push(row);
      }
    }
    sheets.push({ name, heads, rows, dateCols: [4, 17], moneyCols: [6, 7, 8, 9, 10, 11] });
  }

  section(d.docdata, "b2b", "B2B", false);
  section(d.docdata, "cdnr", "CDNR", true);

  if (d.docRejdata?.b2b?.length) section(d.docRejdata, "b2b", "B2B_Rejected", false);
  if (d.docRejdata?.cdnr?.length) section(d.docRejdata, "cdnr", "CDNR_Rejected", true);

  for (const k of Object.keys(d.docdata)) {
    if (!["b2b", "cdnr"].includes(k) && d.docdata[k]?.length) {
      extra.push(k);
    }
  }

  return { sheets, d, extra };
}

/**
 * Flattens GSTR-2B extraction result into standardized invoice objects for Smart Reconcile
 */
export function flattenGstr2bToStandardInvoices(extraction: Gstr2bExtractionResult): any[] {
  const flattened: any[] = [];
  extraction.sheets.forEach((sheet) => {
    const isNote = sheet.name.toLowerCase().includes("cdnr");
    sheet.rows.forEach((row) => {
      // mapping indices from sheet heads:
      // 1: Supplier GSTIN
      // 2: Supplier Trade Name
      // 3: Invoice/Note Number
      // 4: Invoice/Note Date
      // 5: Type
      // 6: Value
      // 7: Taxable Value
      // 8: IGST
      // 9: CGST
      // 10: SGST
      // 11: Cess
      // 16: Return Period
      // 19: Recipient GSTIN
      const gstin = String(row[1] || "").trim();
      const supplierName = String(row[2] || "").trim();
      const invoiceNo = String(row[3] || "").trim();
      if (!invoiceNo && !gstin) return;

      flattened.push({
        GSTIN: gstin,
        "Supplier Name": supplierName,
        "Invoice Number": invoiceNo,
        "Invoice Date": row[4] !== "" ? String(row[4]) : "",
        "Document Type": isNote ? (row[5].includes("Credit") ? "CRN" : "DBN") : "INV",
        "Invoice Value": Number(row[6]) || 0,
        "Taxable Value": Number(row[7]) || 0,
        "IGST": Number(row[8]) || 0,
        "CGST": Number(row[9]) || 0,
        "SGST": Number(row[10]) || 0,
        "Cess": Number(row[11]) || 0,
        "Return Period": String(row[16] || extraction.d?.rtnprd || ""),
      });
    });
  });
  return flattened;
}
