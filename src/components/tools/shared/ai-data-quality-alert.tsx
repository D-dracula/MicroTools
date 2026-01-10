"use client";

/**
 * AI Data Quality Alert Component
 * Displays AI-generated explanations for data issues
 * Reusable across all AI tools
 */

import { useState } from "react";
import { AlertTriangle, Info, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataQualityInfo {
  skippedRows: number;
  totalRows: number;
  warnings: string[];
  explanation?: string;
}

interface AIDataQualityAlertProps {
  dataQuality: DataQualityInfo;
  className?: string;
  locale?: string;
}

export function AIDataQualityAlert({ 
  dataQuality, 
  className,
  locale = "ar" 
}: AIDataQualityAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isRTL = locale === "ar";

  const { skippedRows, totalRows, warnings, explanation } = dataQuality;
  
  // Don't show if no issues
  if (skippedRows === 0 && warnings.length === 0) {
    return null;
  }

  const skippedPercentage = totalRows > 0 
    ? Math.round((skippedRows / totalRows) * 100) 
    : 0;

  // Determine severity
  const severity = skippedPercentage > 30 ? "error" : skippedPercentage > 10 ? "warning" : "info";

  const severityStyles = {
    error: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
    warning: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
  };

  const iconStyles = {
    error: "text-red-500",
    warning: "text-amber-500",
    info: "text-blue-500",
  };

  const labels = {
    ar: {
      dataQuality: "جودة البيانات",
      skippedRows: "صفوف متخطاة",
      outOf: "من",
      showDetails: "عرض التفاصيل",
      hideDetails: "إخفاء التفاصيل",
      aiExplanation: "شرح الذكاء الاصطناعي",
      warnings: "تحذيرات",
    },
    en: {
      dataQuality: "Data Quality",
      skippedRows: "Skipped rows",
      outOf: "out of",
      showDetails: "Show details",
      hideDetails: "Hide details",
      aiExplanation: "AI Explanation",
      warnings: "Warnings",
    },
  };

  const t = labels[locale as keyof typeof labels] || labels.en;

  return (
    <div 
      className={cn(
        "rounded-lg border p-4 space-y-3",
        severityStyles[severity],
        className
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn("h-5 w-5", iconStyles[severity])} />
          <span className="font-medium">{t.dataQuality}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {t.skippedRows}: <span className="font-medium">{skippedRows}</span> {t.outOf} {totalRows} ({skippedPercentage}%)
        </div>
      </div>

      {/* Warnings Summary */}
      {warnings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {warnings.slice(0, 2).map((warning, index) => (
            <span 
              key={index}
              className="inline-flex items-center gap-1 text-xs bg-white/50 dark:bg-black/20 px-2 py-1 rounded"
            >
              <Info className="h-3 w-3" />
              {warning}
            </span>
          ))}
          {warnings.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{warnings.length - 2} {isRTL ? "أخرى" : "more"}
            </span>
          )}
        </div>
      )}

      {/* Expandable AI Explanation */}
      {explanation && (
        <div className="space-y-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium hover:underline"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            {isExpanded ? t.hideDetails : t.showDetails}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <div className="bg-white/70 dark:bg-black/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                {t.aiExplanation}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIDataQualityAlert;
