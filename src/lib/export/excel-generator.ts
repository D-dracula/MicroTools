/**
 * Excel Generator Service
 * Uses xlsx library for spreadsheet generation
 * Requirements: 0.16, 0.17
 */

import * as XLSX from "xlsx";

export interface ExcelExportOptions {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
  locale: "ar" | "en";
}

/**
 * Generate an Excel file from export data
 * Supports RTL for Arabic locale
 */
export async function generateExcel(options: ExcelExportOptions): Promise<Blob> {
  const wb = XLSX.utils.book_new();

  // Create worksheet data with headers
  const wsData = [options.headers, ...options.rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set RTL direction for Arabic - Requirement 0.16
  if (options.locale === "ar") {
    if (!ws["!dir"]) {
      ws["!dir"] = "rtl";
    }
  }

  // Auto-size columns based on content
  const colWidths = options.headers.map((header, colIndex) => {
    const headerLength = header.length;
    const maxDataLength = options.rows.reduce((max, row) => {
      const cellValue = row[colIndex];
      const cellLength = cellValue !== undefined ? String(cellValue).length : 0;
      return Math.max(max, cellLength);
    }, 0);
    return { wch: Math.max(headerLength, maxDataLength) + 2 };
  });
  ws["!cols"] = colWidths;

  // Style header row (bold)
  const headerRange = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[cellAddress]) {
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "F0F0F0" } },
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, options.sheetName.substring(0, 31)); // Excel sheet name limit

  // Generate Excel buffer
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Generate Excel with multiple sheets
 * Useful for batch exports - Requirement 0.18
 */
export async function generateExcelMultiSheet(
  sheets: {
    name: string;
    headers: string[];
    rows: (string | number)[][];
  }[],
  locale: "ar" | "en"
): Promise<Blob> {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const wsData = [sheet.headers, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    if (locale === "ar") {
      ws["!dir"] = "rtl";
    }

    // Auto-size columns
    const colWidths = sheet.headers.map((header, colIndex) => {
      const headerLength = header.length;
      const maxDataLength = sheet.rows.reduce((max, row) => {
        const cellValue = row[colIndex];
        const cellLength = cellValue !== undefined ? String(cellValue).length : 0;
        return Math.max(max, cellLength);
      }, 0);
      return { wch: Math.max(headerLength, maxDataLength) + 2 };
    });
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
  }

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Generate comparison table Excel
 * Specifically for tools with provider/carrier comparisons - Requirement 0.17
 */
export async function generateComparisonExcel(
  title: string,
  comparison: {
    headers: string[];
    rows: (string | number)[][];
  },
  metadata: {
    inputs: Record<string, string | number>;
    locale: "ar" | "en";
  }
): Promise<Blob> {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Comparison Table
  const comparisonData = [comparison.headers, ...comparison.rows];
  const comparisonWs = XLSX.utils.aoa_to_sheet(comparisonData);

  if (metadata.locale === "ar") {
    comparisonWs["!dir"] = "rtl";
  }

  // Auto-size columns
  const colWidths = comparison.headers.map((header, colIndex) => {
    const headerLength = header.length;
    const maxDataLength = comparison.rows.reduce((max, row) => {
      const cellValue = row[colIndex];
      const cellLength = cellValue !== undefined ? String(cellValue).length : 0;
      return Math.max(max, cellLength);
    }, 0);
    return { wch: Math.max(headerLength, maxDataLength) + 2 };
  });
  comparisonWs["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, comparisonWs, "Comparison");

  // Sheet 2: Input Parameters
  const inputHeaders = [
    metadata.locale === "ar" ? "المعامل" : "Parameter",
    metadata.locale === "ar" ? "القيمة" : "Value",
  ];
  const inputRows = Object.entries(metadata.inputs).map(([key, value]) => [
    key,
    value,
  ]);
  const inputData = [inputHeaders, ...inputRows];
  const inputWs = XLSX.utils.aoa_to_sheet(inputData);

  if (metadata.locale === "ar") {
    inputWs["!dir"] = "rtl";
  }

  inputWs["!cols"] = [{ wch: 25 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(wb, inputWs, "Inputs");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
