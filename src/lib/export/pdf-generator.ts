/**
 * PDF Generator Service
 * Uses jsPDF for English-only PDF generation
 * Requirements: 0.13, 0.14
 */

import jsPDF from "jspdf";

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  logo?: string;
  data: {
    section: string;
    items: { label: string; value: string }[];
  }[];
  footer?: string;
}

/**
 * Generate a PDF document from export data
 * Note: PDF export uses English only (no Arabic text) as per requirements
 */
export async function generatePDF(options: PDFExportOptions): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Header with branding - Requirement 0.13
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Micro Tools - micro-tools.com", pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 6;

  // Date
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }), pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text(options.title, pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  // Subtitle if provided
  if (options.subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(options.subtitle, pageWidth / 2, yPos, { align: "center" });
    yPos += 8;
  }

  // Horizontal line
  yPos += 5;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Sections
  for (const section of options.data) {
    // Check for page break
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    // Section header
    doc.setFontSize(13);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text(section.section, margin, yPos);
    yPos += 8;

    // Section items
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    for (const item of section.items) {
      // Check for page break
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }

      // Label
      doc.setTextColor(80, 80, 80);
      doc.text(`${item.label}:`, margin + 5, yPos);

      // Value - right aligned or after label
      doc.setTextColor(30, 30, 30);
      const labelWidth = doc.getTextWidth(`${item.label}: `);
      const valueX = margin + 5 + labelWidth + 5;
      
      // Handle long values by wrapping
      const maxValueWidth = pageWidth - valueX - margin;
      const splitValue = doc.splitTextToSize(item.value, maxValueWidth);
      
      doc.text(splitValue, valueX, yPos);
      yPos += 6 * splitValue.length;
    }

    yPos += 8;
  }

  // Footer on all pages - Requirement 0.13
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    
    // Footer line
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    doc.text(
      `Micro Tools | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return doc.output("blob");
}

/**
 * Generate PDF with comparison table
 * Useful for tools with provider/carrier comparisons
 */
export async function generatePDFWithTable(
  options: PDFExportOptions & {
    table?: {
      headers: string[];
      rows: (string | number)[][];
    };
  }
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Micro Tools - micro-tools.com", pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 6;

  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString("en-US"), pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 15;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text(options.title, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Regular sections
  for (const section of options.data) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(13);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text(section.section, margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    for (const item of section.items) {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }

      doc.setTextColor(80, 80, 80);
      doc.text(`${item.label}:`, margin + 5, yPos);
      doc.setTextColor(30, 30, 30);
      doc.text(item.value, margin + 70, yPos);
      yPos += 6;
    }

    yPos += 8;
  }

  // Table if provided
  if (options.table && options.table.headers.length > 0) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(13);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text("Comparison Table", margin, yPos);
    yPos += 10;

    const colCount = options.table.headers.length;
    const colWidth = (pageWidth - 2 * margin) / colCount;

    // Table headers
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, "F");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    
    options.table.headers.forEach((header, i) => {
      doc.text(header, margin + i * colWidth + 2, yPos);
    });
    yPos += 8;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);

    for (const row of options.table.rows) {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
      }

      row.forEach((cell, i) => {
        doc.text(String(cell), margin + i * colWidth + 2, yPos);
      });
      yPos += 6;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Micro Tools | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return doc.output("blob");
}
