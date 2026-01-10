"use client";

/**
 * AI Share Buttons Component
 * Provides WhatsApp and Twitter share functionality with AI tool summaries
 * 
 * Requirements: 8.3
 */

import { useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

export interface AIShareButtonsProps {
  /** Summary text to share */
  summaryText: string;
  /** Tool title for the share message */
  toolTitle: string;
  /** Optional custom URL to share (defaults to current page) */
  shareUrl?: string;
  /** Callback when WhatsApp share is clicked */
  onShareWhatsApp?: () => void;
  /** Callback when Twitter share is clicked */
  onShareTwitter?: () => void;
}

/**
 * AI Share Buttons Component
 * Provides WhatsApp and Twitter share links with summary text
 * Requirement: 8.3
 */
export function AIShareButtons({
  summaryText,
  toolTitle,
  shareUrl,
  onShareWhatsApp,
  onShareTwitter,
}: AIShareButtonsProps) {
  const t = useTranslations("share");
  const locale = useLocale();
  const isRTL = locale === "ar";

  /**
   * Share via WhatsApp
   * Creates a WhatsApp share link with the summary text and URL
   */
  const handleShareWhatsApp = useCallback(() => {
    try {
      const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
      const fullText = `${summaryText}\n\n🔗 ${url}`;
      const encodedText = encodeURIComponent(fullText);
      const whatsappUrl = `https://wa.me/?text=${encodedText}`;
      
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      
      toast.success(isRTL ? "تم فتح واتساب" : "WhatsApp opened");
      onShareWhatsApp?.();
    } catch (error) {
      console.error("Failed to share via WhatsApp:", error);
      toast.error(isRTL ? "فشل فتح واتساب" : "Failed to open WhatsApp");
    }
  }, [summaryText, shareUrl, isRTL, onShareWhatsApp]);

  /**
   * Share via Twitter/X
   * Creates a Twitter share link with the tool title and URL
   */
  const handleShareTwitter = useCallback(() => {
    try {
      const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
      
      // Twitter has character limits, so we use a shorter message
      const tweetText = isRTL
        ? `${toolTitle} - أداة ذكية من أدوات التجارة 🛒`
        : `${toolTitle} - Smart tool from Micro Tools 🛒`;
      
      const encodedText = encodeURIComponent(tweetText);
      const encodedUrl = encodeURIComponent(url);
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
      
      toast.success(isRTL ? "تم فتح تويتر" : "Twitter opened");
      onShareTwitter?.();
    } catch (error) {
      console.error("Failed to share via Twitter:", error);
      toast.error(isRTL ? "فشل فتح تويتر" : "Failed to open Twitter");
    }
  }, [toolTitle, shareUrl, isRTL, onShareTwitter]);

  return (
    <div
      className="flex flex-wrap gap-2 justify-center"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* WhatsApp Share Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleShareWhatsApp}
        className="gap-2 hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950/20"
        aria-label={t("shareWhatsApp")}
      >
        <MessageCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
        <span>{t("shareWhatsApp")}</span>
      </Button>

      {/* Twitter/X Share Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleShareTwitter}
        className="gap-2 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/20"
        aria-label={t("shareTwitter")}
      >
        <svg 
          className="h-4 w-4" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span>{t("shareTwitter")}</span>
      </Button>
    </div>
  );
}

/**
 * Generate share summary for Smart Profit Audit
 */
export function generateSmartProfitShareSummary(
  data: {
    netProfit: number;
    profitMargin: number;
    losingProductsCount: number;
  },
  locale: "ar" | "en"
): string {
  const isRTL = locale === "ar";
  const currency = isRTL ? "ر.س" : "SAR";
  const profitStatus = data.netProfit >= 0
    ? (isRTL ? "✅ رابح" : "✅ Profitable")
    : (isRTL ? "❌ خاسر" : "❌ Losing");

  return isRTL
    ? `📊 محلل الأرباح الشامل
${profitStatus}
💰 صافي الربح: ${data.netProfit.toFixed(2)} ${currency}
📈 هامش الربح: ${data.profitMargin.toFixed(1)}%
⚠️ منتجات خاسرة: ${data.losingProductsCount}

🛒 أدوات التجارة - أدوات ذكية للتجار`
    : `📊 Smart Profit Audit
${profitStatus}
💰 Net Profit: ${data.netProfit.toFixed(2)} ${currency}
📈 Profit Margin: ${data.profitMargin.toFixed(1)}%
⚠️ Losing Products: ${data.losingProductsCount}

🛒 Micro Tools - Smart tools for merchants`;
}

/**
 * Generate share summary for Review Insight
 */
export function generateReviewInsightShareSummary(
  data: {
    totalReviews: number;
    positivePercent: number;
    negativePercent: number;
    painPointsCount: number;
  },
  locale: "ar" | "en"
): string {
  const isRTL = locale === "ar";

  return isRTL
    ? `📝 محلل مراجعات المنافسين
📊 إجمالي المراجعات: ${data.totalReviews}
👍 إيجابية: ${data.positivePercent.toFixed(1)}%
👎 سلبية: ${data.negativePercent.toFixed(1)}%
⚠️ نقاط الألم: ${data.painPointsCount}

🛒 أدوات التجارة - أدوات ذكية للتجار`
    : `📝 AI Review Insight
📊 Total Reviews: ${data.totalReviews}
👍 Positive: ${data.positivePercent.toFixed(1)}%
👎 Negative: ${data.negativePercent.toFixed(1)}%
⚠️ Pain Points: ${data.painPointsCount}

🛒 Micro Tools - Smart tools for merchants`;
}

/**
 * Generate share summary for Inventory Forecaster
 */
export function generateInventoryForecastShareSummary(
  data: {
    totalProducts: number;
    criticalAlerts: number;
    warningAlerts: number;
  },
  locale: "ar" | "en"
): string {
  const isRTL = locale === "ar";

  return isRTL
    ? `📦 متنبئ المخزون
📊 إجمالي المنتجات: ${data.totalProducts}
🚨 تنبيهات حرجة: ${data.criticalAlerts}
⚠️ تنبيهات تحذيرية: ${data.warningAlerts}

🛒 أدوات التجارة - أدوات ذكية للتجار`
    : `📦 AI Inventory Forecaster
📊 Total Products: ${data.totalProducts}
🚨 Critical Alerts: ${data.criticalAlerts}
⚠️ Warning Alerts: ${data.warningAlerts}

🛒 Micro Tools - Smart tools for merchants`;
}

/**
 * Generate share summary for Ad Spend Auditor
 */
export function generateAdSpendShareSummary(
  data: {
    totalSpend: number;
    overallROI: number;
    wastedBudget: number;
    profitableCampaigns: number;
    totalCampaigns: number;
  },
  locale: "ar" | "en"
): string {
  const isRTL = locale === "ar";
  const currency = isRTL ? "ر.س" : "SAR";

  return isRTL
    ? `📢 محلل أداء الحملات
💰 إجمالي الإنفاق: ${data.totalSpend.toFixed(2)} ${currency}
📈 العائد على الاستثمار: ${data.overallROI.toFixed(1)}%
💸 الميزانية المهدرة: ${data.wastedBudget.toFixed(2)} ${currency}
✅ حملات رابحة: ${data.profitableCampaigns}/${data.totalCampaigns}

🛒 أدوات التجارة - أدوات ذكية للتجار`
    : `📢 Ad Spend Auditor
💰 Total Spend: ${data.totalSpend.toFixed(2)} ${currency}
📈 Overall ROI: ${data.overallROI.toFixed(1)}%
💸 Wasted Budget: ${data.wastedBudget.toFixed(2)} ${currency}
✅ Profitable Campaigns: ${data.profitableCampaigns}/${data.totalCampaigns}

🛒 Micro Tools - Smart tools for merchants`;
}

/**
 * Generate share summary for Catalog Cleaner
 */
export function generateCatalogCleanerShareSummary(
  data: {
    totalProducts: number;
    translated: number;
    keywordsGenerated: number;
  },
  locale: "ar" | "en"
): string {
  const isRTL = locale === "ar";

  return isRTL
    ? `🧹 منظف بيانات المنتجات
📦 إجمالي المنتجات: ${data.totalProducts}
🌐 تمت الترجمة: ${data.translated}
🏷️ كلمات SEO: ${data.keywordsGenerated}

🛒 أدوات التجارة - أدوات ذكية للتجار`
    : `🧹 AI Catalog Cleaner
📦 Total Products: ${data.totalProducts}
🌐 Translated: ${data.translated}
🏷️ SEO Keywords: ${data.keywordsGenerated}

🛒 Micro Tools - Smart tools for merchants`;
}

export default AIShareButtons;
