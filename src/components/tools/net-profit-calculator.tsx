"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import {
  calculateNetProfit_Full,
  formatNumber,
  formatPercentage,
} from "@/lib/calculators/net-profit";
import { SEOContent, ResultCard, ShareButtons } from "@/components/tools/shared";

/**
 * Net Profit Calculator Component
 * Calculates real profit after accounting for returns and processing costs
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.9
 */
export function NetProfitCalculator() {
  const t = useTranslations("tools.netProfitCalculator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states - Requirements 2.1, 2.2, 2.3, 2.4
  const [revenue, setRevenue] = useState<string>("");
  const [productCost, setProductCost] = useState<string>("");
  const [returnRate, setReturnRate] = useState<string>("");
  const [processingCost, setProcessingCost] = useState<string>("");

  // Parse input values to numbers
  const parsedInputs = useMemo(() => ({
    revenue: parseFloat(revenue) || undefined,
    productCost: parseFloat(productCost) || undefined,
    returnRate: parseFloat(returnRate) || undefined,
    processingCost: parseFloat(processingCost) || undefined,
  }), [revenue, productCost, returnRate, processingCost]);

  // Calculate results in real-time
  const results = useMemo(() => {
    const { revenue, productCost, returnRate, processingCost } = parsedInputs;
    if (revenue === undefined || productCost === undefined || 
        returnRate === undefined || processingCost === undefined) {
      return null;
    }
    return calculateNetProfit_Full({
      revenue,
      productCost,
      returnRate,
      processingCost,
    });
  }, [parsedInputs]);

  const hasValidInputs = results !== null;
  const showResults = hasValidInputs && results;
  const hasAnyInput = revenue !== "" || productCost !== "" || returnRate !== "" || processingCost !== "";

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results || !parsedInputs.revenue) return "";
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("revenue")}: ${formatNumber(parsedInputs.revenue!)}
${t("productCost")}: ${formatNumber(parsedInputs.productCost!)}
${t("returnRate")}: ${formatPercentage(parsedInputs.returnRate!)}
${t("processingCost")}: ${formatNumber(parsedInputs.processingCost!)}
━━━━━━━━━━━━━━━━━━
${t("netProfit")}: ${formatNumber(results.netProfit)}
${t("effectiveMargin")}: ${formatPercentage(results.effectiveMargin)}
${t("returnLosses")}: ${formatNumber(results.returnLosses)}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedInputs, t, isRTL]);

  // Result card data for sharing
  const resultCardInputs = useMemo(() => ({
    revenue: { label: t("revenue"), value: formatNumber(parsedInputs.revenue || 0) },
    productCost: { label: t("productCost"), value: formatNumber(parsedInputs.productCost || 0) },
    returnRate: { label: t("returnRate"), value: formatPercentage(parsedInputs.returnRate || 0) },
    processingCost: { label: t("processingCost"), value: formatNumber(parsedInputs.processingCost || 0) },
  }), [parsedInputs, t]);

  const resultCardOutputs = useMemo(() => {
    if (!results) return {};
    return {
      netProfit: { label: t("netProfit"), value: formatNumber(results.netProfit), highlight: true },
      effectiveMargin: { label: t("effectiveMargin"), value: formatPercentage(results.effectiveMargin) },
      returnLosses: { label: t("returnLosses"), value: formatNumber(results.returnLosses) },
    };
  }, [results, t]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Revenue Input - Requirement 2.1 */}
          <div className="space-y-2">
            <Label htmlFor="revenue">{t("revenue")}</Label>
            <Input
              id="revenue"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={revenue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRevenue(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Product Cost Input - Requirement 2.2 */}
          <div className="space-y-2">
            <Label htmlFor="productCost">{t("productCost")}</Label>
            <Input
              id="productCost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={productCost}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductCost(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Return Rate Input - Requirement 2.3 */}
          <div className="space-y-2">
            <Label htmlFor="returnRate">{t("returnRate")}</Label>
            <Input
              id="returnRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="0"
              value={returnRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnRate(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Processing Cost Input - Requirement 2.4 */}
          <div className="space-y-2">
            <Label htmlFor="processingCost">{t("processingCost")}</Label>
            <Input
              id="processingCost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={processingCost}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProcessingCost(e.target.value)}
              className="text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && results && (
        <>
          {/* High Return Rate Warning - Requirement 2.9 */}
          {results.hasHighReturnRate && (
            <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  <span className="font-medium">{t("highReturnWarning")}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card 
            className={results.netProfit < 0 ? "border-destructive" : "border-green-500"}
            role="region"
            aria-label={isRTL ? "نتائج الحساب" : "Calculation results"}
            aria-live="polite"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.netProfit < 0 ? (
                  <>
                    <TrendingDown className="h-5 w-5 text-destructive" aria-hidden="true" />
                    <span className="text-destructive">{t("loss")}</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-green-500">{t("profit")}</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Net Profit - Requirement 2.6 */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("netProfit")}</dt>
                  <dd className={`text-2xl font-bold ${results.netProfit < 0 ? "text-destructive" : "text-green-500"}`}>
                    {results.netProfit < 0 ? "-" : "+"}{formatNumber(Math.abs(results.netProfit))}
                  </dd>
                </div>

                {/* Effective Margin - Requirement 2.7 */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("effectiveMargin")}</dt>
                  <dd className={`text-2xl font-bold ${results.effectiveMargin < 0 ? "text-destructive" : "text-green-500"}`}>
                    {formatPercentage(results.effectiveMargin)}
                  </dd>
                </div>

                {/* Return Losses - Requirement 2.8 */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("returnLosses")}</dt>
                  <dd className="text-2xl font-bold text-orange-500">
                    {formatNumber(results.returnLosses)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Shareable Result Card (hidden, used for image generation) */}
          <div className="sr-only">
            <ResultCard
              ref={resultCardRef}
              toolName={t("title")}
              inputs={resultCardInputs}
              outputs={resultCardOutputs}
            />
          </div>

          {/* Share Buttons */}
          <ShareButtons
            copyText={copyText}
          />
        </>
      )}

      {/* Validation Message */}
      {!hasValidInputs && hasAnyInput && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterValidNumbers")}
        </p>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="netProfitCalculator" />
    </div>
  );
}
