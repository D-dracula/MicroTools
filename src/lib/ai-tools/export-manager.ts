/**
 * Export Manager for AI Tools
 * Provides unified export functionality for all AI-powered tools
 * 
 * Requirements: 8.1, 8.2
 */

import * as XLSX from "xlsx";
import jsPDF from "jspdf";

// ============================================================================
// Types
// ============================================================================

export interface ExportOptions {
  locale: "ar" | "en";
  filename: string;
  title: string;
}

export interface SmartProfitExportData {
  summary: {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    profitableOrders: number;
    unprofitableOrders: number;
  };
  costBreakdown: {
    paymentGatewayFees: number;
    shippingCosts: number;
    taxes: number;
    refunds: number;
    otherCosts: number;
  };
  losingProducts: Array<{
    productName: string;
    totalOrders: number;
    totalLoss: number;
    lossReason: string;
  }>;
  recommendations: string[];
}

export interface ReviewInsightExportData {
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
    total: number;
  };
  painPoints: Array<{
    issue: string;
    frequency: number;
    severity: string;
  }>;
  praisedFeatures: Array<{
    feature: string;
    frequency: number;
  }>;
  recommendations: string[];
}

export interface CatalogCleanerExportData {
  products: Array<{
    id: string;
    originalTitle: string;
    cleanedTitle: string;
    originalDescription: string;
    cleanedDescription: string;
    seoKeywords: string[];
  }>;
  stats: {
    totalProducts: number;
    translated: number;
    cleaned: number;
    keywordsGenerated: number;
  };
}

export interface InventoryForecastExportData {
  predictions: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    averageDailySales: number;
    daysUntilStockout: number;
    predictedStockoutDate: string;
    recommendedOrderQuantity: number;
  }>;
  alerts: Array<{
    productName: string;
    message: string;
    severity: string;
  }>;
}

export interface AdSpendExportData {
  campaigns: Array<{
    campaignName: string;
    platform: string;
    spend: number;
    revenue: number;
    profit: number;
    roi: number;
    cpa: number;
    isProfitable: boolean;
  }>;
  summary: {
    totalAdSpend: number;
    totalRevenue: number;
    totalProfit: number;
    overallROI: number;
    wastedBudget: number;
  };
  recommendations: string[];
}

// ============================================================================
// Excel Export Functions
// ============================================================================

/**
 * Export Smart Profit Audit results to Excel
 * Requirement: 8.1 - Smart Profit Audit: Excel with full breakdown
 */
export async function exportSmartProfitToExcel(
  data: SmartProfitExportData,
  options: ExportOptions
): Promise<Blob> {
  const wb = XLSX.utils.book_new();
  const isRTL = options.locale === "ar";

  // Summary Sheet
  const summaryHeaders = isRTL
    ? ["البند", "القيمة"]
    : ["Item", "Value"];
  
  const summaryRows = [
    [isRTL ? "إجمالي الإيرادات" : "Total Revenue", data.summary.totalRevenue],
    [isRTL ? "إجمالي التكاليف" : "Total Costs", data.summary.totalCosts],
    [isRTL ? "صافي الربح" : "Net Profit", data.summary.netProfit],
    [isRTL ? "هامش الربح %" : "Profit Margin %", `${data.summary.profitMargin.toFixed(2)}%`],
    [isRTL ? "الطلبات الرابحة" : "Profitable Orders", data.summary.profitableOrders],
    [isRTL ? "الطلبات الخاسرة" : "Unprofitable Orders", data.summary.unprofitableOrders],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  if (isRTL) summaryWs["!dir"] = "rtl";
  summaryWs["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, isRTL ? "الملخص" : "Summary");

  // Cost Breakdown Sheet
  const costHeaders = isRTL
    ? ["الفئة", "المبلغ"]
    : ["Category", "Amount"];
  
  const costRows = [
    [isRTL ? "رسوم بوابة الدفع" : "Payment Gateway Fees", data.costBreakdown.paymentGatewayFees],
    [isRTL ? "تكاليف الشحن" : "Shipping Costs", data.costBreakdown.shippingCosts],
    [isRTL ? "الضرائب" : "Taxes", data.costBreakdown.taxes],
    [isRTL ? "المرتجعات" : "Refunds", data.costBreakdown.refunds],
    [isRTL ? "تكاليف أخرى" : "Other Costs", data.costBreakdown.otherCosts],
  ];

  const costWs = XLSX.utils.aoa_to_sheet([costHeaders, ...costRows]);
  if (isRTL) costWs["!dir"] = "rtl";
  costWs["!cols"] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, costWs, isRTL ? "تفصيل التكاليف" : "Cost Breakdown");

  // Losing Products Sheet
  if (data.losingProducts.length > 0) {
    const losingHeaders = isRTL
      ? ["المنتج", "عدد الطلبات", "إجمالي الخسارة", "سبب الخسارة"]
      : ["Product", "Orders", "Total Loss", "Loss Reason"];
    
    const losingRows = data.losingProducts.map(p => [
      p.productName,
      p.totalOrders,
      p.totalLoss,
      p.lossReason,
    ]);

    const losingWs = XLSX.utils.aoa_to_sheet([losingHeaders, ...losingRows]);
    if (isRTL) losingWs["!dir"] = "rtl";
    losingWs["!cols"] = [{ wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, losingWs, isRTL ? "المنتجات الخاسرة" : "Losing Products");
  }

  // Recommendations Sheet
  if (data.recommendations.length > 0) {
    const recHeaders = [isRTL ? "التوصيات" : "Recommendations"];
    const recRows = data.recommendations.map(r => [r]);
    
    const recWs = XLSX.utils.aoa_to_sheet([recHeaders, ...recRows]);
    if (isRTL) recWs["!dir"] = "rtl";
    recWs["!cols"] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, recWs, isRTL ? "التوصيات" : "Recommendations");
  }

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Export Inventory Forecast results to Excel
 * Requirement: 8.1 - AI Inventory Forecaster: Excel with predictions
 */
export async function exportInventoryForecastToExcel(
  data: InventoryForecastExportData,
  options: ExportOptions
): Promise<Blob> {
  const wb = XLSX.utils.book_new();
  const isRTL = options.locale === "ar";

  // Predictions Sheet
  const predHeaders = isRTL
    ? ["المنتج", "المخزون الحالي", "المبيعات اليومية", "أيام حتى النفاد", "تاريخ النفاد المتوقع", "الكمية الموصى بها"]
    : ["Product", "Current Stock", "Daily Sales", "Days Until Stockout", "Predicted Stockout", "Recommended Order"];
  
  const predRows = data.predictions.map(p => [
    p.productName,
    p.currentStock,
    p.averageDailySales.toFixed(1),
    p.daysUntilStockout,
    p.predictedStockoutDate,
    p.recommendedOrderQuantity,
  ]);

  const predWs = XLSX.utils.aoa_to_sheet([predHeaders, ...predRows]);
  if (isRTL) predWs["!dir"] = "rtl";
  predWs["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, predWs, isRTL ? "التنبؤات" : "Predictions");

  // Alerts Sheet
  if (data.alerts.length > 0) {
    const alertHeaders = isRTL
      ? ["المنتج", "التنبيه", "الأهمية"]
      : ["Product", "Alert", "Severity"];
    
    const alertRows = data.alerts.map(a => [
      a.productName,
      a.message,
      a.severity,
    ]);

    const alertWs = XLSX.utils.aoa_to_sheet([alertHeaders, ...alertRows]);
    if (isRTL) alertWs["!dir"] = "rtl";
    alertWs["!cols"] = [{ wch: 25 }, { wch: 50 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, alertWs, isRTL ? "التنبيهات" : "Alerts");
  }

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Export Ad Spend Auditor results to Excel
 * Requirement: 8.1 - Ad Spend Auditor: Excel with campaign analysis
 */
export async function exportAdSpendToExcel(
  data: AdSpendExportData,
  options: ExportOptions
): Promise<Blob> {
  const wb = XLSX.utils.book_new();
  const isRTL = options.locale === "ar";

  // Summary Sheet
  const summaryHeaders = isRTL
    ? ["البند", "القيمة"]
    : ["Item", "Value"];
  
  const summaryRows = [
    [isRTL ? "إجمالي الإنفاق الإعلاني" : "Total Ad Spend", data.summary.totalAdSpend],
    [isRTL ? "إجمالي الإيرادات" : "Total Revenue", data.summary.totalRevenue],
    [isRTL ? "إجمالي الربح" : "Total Profit", data.summary.totalProfit],
    [isRTL ? "العائد على الاستثمار %" : "Overall ROI %", `${data.summary.overallROI.toFixed(2)}%`],
    [isRTL ? "الميزانية المهدرة" : "Wasted Budget", data.summary.wastedBudget],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  if (isRTL) summaryWs["!dir"] = "rtl";
  summaryWs["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, isRTL ? "الملخص" : "Summary");

  // Campaigns Sheet
  const campHeaders = isRTL
    ? ["الحملة", "المنصة", "الإنفاق", "الإيرادات", "الربح", "ROI %", "CPA", "مربحة؟"]
    : ["Campaign", "Platform", "Spend", "Revenue", "Profit", "ROI %", "CPA", "Profitable?"];
  
  const campRows = data.campaigns.map(c => [
    c.campaignName,
    c.platform,
    c.spend,
    c.revenue,
    c.profit,
    `${c.roi.toFixed(2)}%`,
    c.cpa.toFixed(2),
    c.isProfitable ? (isRTL ? "نعم" : "Yes") : (isRTL ? "لا" : "No"),
  ]);

  const campWs = XLSX.utils.aoa_to_sheet([campHeaders, ...campRows]);
  if (isRTL) campWs["!dir"] = "rtl";
  campWs["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, campWs, isRTL ? "الحملات" : "Campaigns");

  // Recommendations Sheet
  if (data.recommendations.length > 0) {
    const recHeaders = [isRTL ? "التوصيات" : "Recommendations"];
    const recRows = data.recommendations.map(r => [r]);
    
    const recWs = XLSX.utils.aoa_to_sheet([recHeaders, ...recRows]);
    if (isRTL) recWs["!dir"] = "rtl";
    recWs["!cols"] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, recWs, isRTL ? "التوصيات" : "Recommendations");
  }

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Export Catalog Cleaner results to CSV
 * Requirement: 8.1 - AI Catalog Cleaner: CSV/Excel in original format
 */
export async function exportCatalogToExcel(
  data: CatalogCleanerExportData,
  options: ExportOptions
): Promise<Blob> {
  const wb = XLSX.utils.book_new();
  const isRTL = options.locale === "ar";

  // Products Sheet
  const prodHeaders = isRTL
    ? ["ID", "العنوان الأصلي", "العنوان المنظف", "الوصف الأصلي", "الوصف المنظف", "كلمات SEO"]
    : ["ID", "Original Title", "Cleaned Title", "Original Description", "Cleaned Description", "SEO Keywords"];
  
  const prodRows = data.products.map(p => [
    p.id,
    p.originalTitle,
    p.cleanedTitle,
    p.originalDescription,
    p.cleanedDescription,
    p.seoKeywords.join(", "),
  ]);

  const prodWs = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
  if (isRTL) prodWs["!dir"] = "rtl";
  prodWs["!cols"] = [{ wch: 10 }, { wch: 30 }, { wch: 30 }, { wch: 40 }, { wch: 40 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, prodWs, isRTL ? "المنتجات" : "Products");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

// ============================================================================
// PDF Export Functions
// ============================================================================

/**
 * Export Review Insight results to PDF
 * Requirement: 8.1 - AI Review Insight: PDF report with charts
 */
export async function exportReviewInsightToPDF(
  data: ReviewInsightExportData,
  options: ExportOptions
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Micro Tools - AI Review Insight", pageWidth / 2, yPos, { align: "center" });
  yPos += 6;

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
  yPos += 15;

  // Sentiment Distribution
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Sentiment Distribution", margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const total = data.sentimentDistribution.total;
  const posPercent = ((data.sentimentDistribution.positive / total) * 100).toFixed(1);
  const negPercent = ((data.sentimentDistribution.negative / total) * 100).toFixed(1);
  const neuPercent = ((data.sentimentDistribution.neutral / total) * 100).toFixed(1);

  doc.setTextColor(34, 197, 94); // green
  doc.text(`Positive: ${data.sentimentDistribution.positive} (${posPercent}%)`, margin + 5, yPos);
  yPos += 6;
  
  doc.setTextColor(239, 68, 68); // red
  doc.text(`Negative: ${data.sentimentDistribution.negative} (${negPercent}%)`, margin + 5, yPos);
  yPos += 6;
  
  doc.setTextColor(107, 114, 128); // gray
  doc.text(`Neutral: ${data.sentimentDistribution.neutral} (${neuPercent}%)`, margin + 5, yPos);
  yPos += 15;

  // Pain Points
  if (data.painPoints.length > 0) {
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Pain Points", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    for (const point of data.painPoints.slice(0, 5)) {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(`• ${point.issue} (${point.frequency}x, ${point.severity})`, margin + 5, yPos);
      yPos += 6;
    }
    yPos += 10;
  }

  // Praised Features
  if (data.praisedFeatures.length > 0) {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Praised Features", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    for (const feature of data.praisedFeatures.slice(0, 5)) {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(`• ${feature.feature} (${feature.frequency}x)`, margin + 5, yPos);
      yPos += 6;
    }
    yPos += 10;
  }

  // Recommendations
  if (data.recommendations.length > 0) {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("AI Recommendations", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    for (let i = 0; i < Math.min(data.recommendations.length, 5); i++) {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }
      const lines = doc.splitTextToSize(`${i + 1}. ${data.recommendations[i]}`, pageWidth - 2 * margin - 10);
      doc.text(lines, margin + 5, yPos);
      yPos += 6 * lines.length;
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

// ============================================================================
// Copy to Clipboard Functions
// ============================================================================

/**
 * Copy text to clipboard with fallback for older browsers
 * Requirement: 8.2
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * Format Smart Profit Audit results for clipboard
 */
export function formatSmartProfitForClipboard(
  data: SmartProfitExportData,
  locale: "ar" | "en"
): string {
  const isRTL = locale === "ar";
  const currency = isRTL ? "ر.س" : "SAR";
  
  return `${isRTL ? "محلل الأرباح الشامل" : "Smart Profit Audit"}
━━━━━━━━━━━━━━━━━━
${isRTL ? "إجمالي الإيرادات" : "Total Revenue"}: ${data.summary.totalRevenue.toFixed(2)} ${currency}
${isRTL ? "إجمالي التكاليف" : "Total Costs"}: ${data.summary.totalCosts.toFixed(2)} ${currency}
${isRTL ? "صافي الربح" : "Net Profit"}: ${data.summary.netProfit.toFixed(2)} ${currency}
${isRTL ? "هامش الربح" : "Profit Margin"}: ${data.summary.profitMargin.toFixed(2)}%
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
}

/**
 * Format Review Insight results for clipboard
 */
export function formatReviewInsightForClipboard(
  data: ReviewInsightExportData,
  locale: "ar" | "en"
): string {
  const isRTL = locale === "ar";
  const total = data.sentimentDistribution.total;
  
  return `${isRTL ? "محلل مراجعات المنافسين" : "AI Review Insight"}
━━━━━━━━━━━━━━━━━━
${isRTL ? "إجمالي المراجعات" : "Total Reviews"}: ${total}
${isRTL ? "إيجابية" : "Positive"}: ${data.sentimentDistribution.positive} (${((data.sentimentDistribution.positive / total) * 100).toFixed(1)}%)
${isRTL ? "سلبية" : "Negative"}: ${data.sentimentDistribution.negative} (${((data.sentimentDistribution.negative / total) * 100).toFixed(1)}%)
${isRTL ? "محايدة" : "Neutral"}: ${data.sentimentDistribution.neutral} (${((data.sentimentDistribution.neutral / total) * 100).toFixed(1)}%)
━━━━━━━━━━━━━━━━━━
${isRTL ? "نقاط الألم" : "Pain Points"}: ${data.painPoints.length}
${isRTL ? "الميزات المشكورة" : "Praised Features"}: ${data.praisedFeatures.length}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
}

/**
 * Format Ad Spend Auditor results for clipboard
 */
export function formatAdSpendForClipboard(
  data: AdSpendExportData,
  locale: "ar" | "en"
): string {
  const isRTL = locale === "ar";
  const currency = isRTL ? "ر.س" : "SAR";
  
  return `${isRTL ? "محلل أداء الحملات" : "Ad Spend Auditor"}
━━━━━━━━━━━━━━━━━━
${isRTL ? "إجمالي الإنفاق" : "Total Spend"}: ${data.summary.totalAdSpend.toFixed(2)} ${currency}
${isRTL ? "إجمالي الإيرادات" : "Total Revenue"}: ${data.summary.totalRevenue.toFixed(2)} ${currency}
${isRTL ? "إجمالي الربح" : "Total Profit"}: ${data.summary.totalProfit.toFixed(2)} ${currency}
${isRTL ? "العائد على الاستثمار" : "Overall ROI"}: ${data.summary.overallROI.toFixed(2)}%
${isRTL ? "الميزانية المهدرة" : "Wasted Budget"}: ${data.summary.wastedBudget.toFixed(2)} ${currency}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
}

// ============================================================================
// Download Helper
// ============================================================================

/**
 * Trigger file download from Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
