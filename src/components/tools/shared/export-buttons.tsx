"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Copy, Check, Loader2, MessageCircle, FileDown } from "lucide-react";
import { toast } from "sonner";

export interface ExportData {
  inputs: Record<string, string | number | undefined>;
  results: Record<string, string | number | undefined>;
  comparisonTable?: {
    headers: string[];
    rows: (string | number)[][];
  };
  metadata?: {
    toolName: string;
    date: string;
    locale: string;
  };
}

interface ExportButtonsProps {
  data: ExportData;
  filename: string;
  title: string;
  copyText?: string;
  shareUrl?: string;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onExportCSV?: () => void;
  onCopyText?: () => void;
  onShareWhatsApp?: () => void;
  onShareTwitter?: () => void;
}

/**
 * Export Buttons Component
 * Provides PDF, Excel, CSV, Copy functionality
 * Requirements: 0.6, 0.7, 0.12, 0.15
 */
export function ExportButtons({
  data,
  filename,
  title,
  copyText,
  shareUrl,
  onExportPDF,
  onExportExcel,
  onExportCSV,
  onCopyText,
  onShareWhatsApp,
  onShareTwitter,
}: ExportButtonsProps) {
  const t = useTranslations("export");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  /**
   * Export to PDF - Requirement 0.12, 0.13, 0.14
   */
  const handleExportPDF = useCallback(async () => {
    if (isExportingPDF) return;
    setIsExportingPDF(true);

    try {
      const { generatePDF } = await import("@/lib/export/pdf-generator");
      
      const pdfData = {
        title,
        subtitle: data.metadata?.date || new Date().toLocaleDateString("en-US"),
        data: [
          {
            section: "Inputs",
            items: Object.entries(data.inputs).map(([label, value]) => ({
              label,
              value: String(value),
            })),
          },
          {
            section: "Results",
            items: Object.entries(data.results).map(([label, value]) => ({
              label,
              value: String(value),
            })),
          },
        ],
      };

      // Add comparison table if present - Requirement 0.17
      if (data.comparisonTable) {
        pdfData.data.push({
          section: "Comparison",
          items: data.comparisonTable.rows.map((row) => ({
            label: String(row[0]),
            value: row.slice(1).join(" | "),
          })),
        });
      }

      const blob = await generatePDF(pdfData);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(t("pdfExported"));
      onExportPDF?.();
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error(isRTL ? "فشل تصدير PDF" : "Failed to export PDF");
    } finally {
      setIsExportingPDF(false);
    }
  }, [data, filename, title, isExportingPDF, t, isRTL, onExportPDF]);

  /**
   * Export to Excel - Requirement 0.15, 0.16, 0.17
   */
  const handleExportExcel = useCallback(async () => {
    if (isExportingExcel) return;
    setIsExportingExcel(true);

    try {
      const { generateExcel } = await import("@/lib/export/excel-generator");

      // Build rows from inputs and results
      const rows: (string | number)[][] = [];
      
      // Add inputs (filter out undefined values)
      Object.entries(data.inputs).forEach(([label, value]) => {
        if (value !== undefined) {
          rows.push([label, value]);
        }
      });
      
      // Add separator
      rows.push(["---", "---"]);
      
      // Add results (filter out undefined values)
      Object.entries(data.results).forEach(([label, value]) => {
        if (value !== undefined) {
          rows.push([label, value]);
        }
      });

      let excelData;
      
      // If comparison table exists, export it instead - Requirement 0.17
      if (data.comparisonTable) {
        excelData = {
          sheetName: title,
          headers: data.comparisonTable.headers,
          rows: data.comparisonTable.rows,
          locale: locale as "ar" | "en",
        };
      } else {
        excelData = {
          sheetName: title,
          headers: [isRTL ? "البند" : "Item", isRTL ? "القيمة" : "Value"],
          rows,
          locale: locale as "ar" | "en",
        };
      }

      const blob = await generateExcel(excelData);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}-${Date.now()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(t("excelExported"));
      onExportExcel?.();
    } catch (error) {
      console.error("Failed to export Excel:", error);
      toast.error(isRTL ? "فشل تصدير Excel" : "Failed to export Excel");
    } finally {
      setIsExportingExcel(false);
    }
  }, [data, filename, title, locale, isExportingExcel, t, isRTL, onExportExcel]);

  /**
   * Copy result text to clipboard - Requirement 0.6, 0.7
   */
  const handleCopy = useCallback(async () => {
    if (isCopying) return;
    setIsCopying(true);

    try {
      const textToCopy = copyText || formatResultsAsText(data, isRTL);

      if (!navigator.clipboard) {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      } else {
        await navigator.clipboard.writeText(textToCopy);
      }

      setJustCopied(true);
      toast.success(t("copied"));
      onCopyText?.();

      setTimeout(() => setJustCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error(isRTL ? "فشل النسخ" : "Failed to copy");
    } finally {
      setIsCopying(false);
    }
  }, [copyText, data, isCopying, t, isRTL, onCopyText]);

  /**
   * Export to CSV
   */
  const handleExportCSV = useCallback(async () => {
    if (isExportingCSV) return;
    setIsExportingCSV(true);

    try {
      let csvContent = "";
      
      // If comparison table exists, export it
      if (data.comparisonTable) {
        // Add headers
        csvContent += data.comparisonTable.headers.join(",") + "\n";
        // Add rows
        data.comparisonTable.rows.forEach(row => {
          csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
        });
      } else {
        // Export inputs and results
        csvContent += `"${isRTL ? "البند" : "Item"}","${isRTL ? "القيمة" : "Value"}"\n`;
        
        Object.entries(data.inputs).forEach(([label, value]) => {
          if (value !== undefined) {
            csvContent += `"${label}","${value}"\n`;
          }
        });
        
        csvContent += `"---","---"\n`;
        
        Object.entries(data.results).forEach(([label, value]) => {
          if (value !== undefined) {
            csvContent += `"${label}","${value}"\n`;
          }
        });
      }

      // Create and download blob
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(t("csvExported"));
      onExportCSV?.();
    } catch (error) {
      console.error("Failed to export CSV:", error);
      toast.error(isRTL ? "فشل تصدير CSV" : "Failed to export CSV");
    } finally {
      setIsExportingCSV(false);
    }
  }, [data, filename, isExportingCSV, t, isRTL, onExportCSV]);

  /**
   * Share via WhatsApp - Requirement 5.3
   */
  const handleShareWhatsApp = useCallback(() => {
    const textToShare = copyText || formatResultsAsText(data, isRTL);
    const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    const whatsappText = encodeURIComponent(`${textToShare}\n\n${url}`);
    const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    onShareWhatsApp?.();
  }, [copyText, data, isRTL, shareUrl, onShareWhatsApp]);

  /**
   * Share via Twitter/X - Requirement 5.3
   */
  const handleShareTwitter = useCallback(() => {
    const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    const tweetText = encodeURIComponent(`${title}\n${isRTL ? "أدوات التجارة" : "Micro Tools"}`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
    onShareTwitter?.();
  }, [title, isRTL, shareUrl, onShareTwitter]);

  return (
    <div
      className="flex flex-wrap gap-2 justify-center"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Copy Result Button - Requirement 0.6 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        disabled={isCopying}
        className="gap-2"
        aria-label={t("copyResult")}
      >
        {justCopied ? (
          <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
        {t("copyResult")}
      </Button>

      {/* Export PDF Button - Requirement 0.12 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={isExportingPDF}
        className="gap-2"
        aria-label={t("exportPDF")}
      >
        {isExportingPDF ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <FileText className="h-4 w-4" aria-hidden="true" />
        )}
        {t("exportPDF")}
      </Button>

      {/* Export Excel Button - Requirement 0.15 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={isExportingExcel}
        className="gap-2"
        aria-label={t("exportExcel")}
      >
        {isExportingExcel ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
        )}
        {t("exportExcel")}
      </Button>

      {/* Export CSV Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        disabled={isExportingCSV}
        className="gap-2"
        aria-label={t("exportCSV")}
      >
        {isExportingCSV ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <FileDown className="h-4 w-4" aria-hidden="true" />
        )}
        {t("exportCSV")}
      </Button>

      {/* Share via WhatsApp Button - Requirement 5.3 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleShareWhatsApp}
        className="gap-2"
        aria-label={t("shareWhatsApp")}
      >
        <MessageCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
        {t("shareWhatsApp")}
      </Button>

      {/* Share via Twitter Button - Requirement 5.3 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleShareTwitter}
        className="gap-2"
        aria-label={t("shareTwitter")}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        {t("shareTwitter")}
      </Button>
    </div>
  );
}

/**
 * Format results as text for copying
 */
function formatResultsAsText(data: ExportData, isRTL: boolean): string {
  const lines: string[] = [];
  
  if (data.metadata?.toolName) {
    lines.push(data.metadata.toolName);
    lines.push("=".repeat(30));
  }

  if (Object.keys(data.inputs).length > 0) {
    lines.push(isRTL ? "المدخلات:" : "Inputs:");
    Object.entries(data.inputs).forEach(([label, value]) => {
      lines.push(`  ${label}: ${value}`);
    });
    lines.push("");
  }

  if (Object.keys(data.results).length > 0) {
    lines.push(isRTL ? "النتائج:" : "Results:");
    Object.entries(data.results).forEach(([label, value]) => {
      lines.push(`  ${label}: ${value}`);
    });
  }

  lines.push("");
  lines.push(isRTL ? "بواسطة أدوات التجارة" : "Powered by Micro Tools");

  return lines.join("\n");
}
