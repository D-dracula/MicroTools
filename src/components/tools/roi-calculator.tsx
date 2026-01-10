"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, AlertTriangle } from "lucide-react";
import {
  calculateROI,
  formatCurrency,
  formatPercentage,
  formatPaybackPeriod,
} from "@/lib/calculators/roi";
import { SEOContent, ResultCard, ShareButtons } from "@/components/tools/shared";

/**
 * ROI (Return on Investment) Calculator Component
 * Calculates ROI, annualized ROI, and payback period
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
export function ROICalculator() {
  const t = useTranslations("tools.roiCalculator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states - Requirements 11.1, 11.2, 11.3, 11.4
  const [initialInvestment, setInitialInvestment] = useState<string>("");
  const [expectedRevenue, setExpectedRevenue] = useState<string>("");
  const [timePeriod, setTimePeriod] = useState<string>("");
  const [ongoingCosts, setOngoingCosts] = useState<string>("0");

  // Parse input values to numbers
  const parsedInputs = useMemo(() => ({
    initialInvestment: parseFloat(initialInvestment) || undefined,
    expectedRevenue: parseFloat(expectedRevenue) || undefined,
    timePeriod: parseFloat(timePeriod) || undefined,
    ongoingCosts: parseFloat(ongoingCosts) || 0,
  }), [initialInvestment, expectedRevenue, timePeriod, ongoingCosts]);

  // Calculate results in real-time
  const results = useMemo(() => {
    const { initialInvestment: inv, expectedRevenue: rev, timePeriod: tp, ongoingCosts: oc } = parsedInputs;
    if (inv === undefined || rev === undefined || tp === undefined) {
      return null;
    }
    return calculateROI({
      initialInvestment: inv,
      expectedRevenue: rev,
      timePeriod: tp,
      ongoingCosts: oc,
    });
  }, [parsedInputs]);


  const hasValidInputs = results !== null;
  const showResults = hasValidInputs && results;
  const hasAnyInput = initialInvestment !== "" || expectedRevenue !== "" || timePeriod !== "";
  const isNegativeROI = results !== null && !results.isPositive;

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results) return "";
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("initialInvestment")}: ${formatCurrency(parsedInputs.initialInvestment || 0)}
${t("expectedRevenue")}: ${formatCurrency(parsedInputs.expectedRevenue || 0)}
${t("timePeriod")}: ${parsedInputs.timePeriod || 0} ${t("months")}
${t("ongoingCosts")}: ${formatCurrency(parsedInputs.ongoingCosts || 0)}
━━━━━━━━━━━━━━━━━━
${t("netProfit")}: ${formatCurrency(results.netProfit)}
${t("roiPercentage")}: ${formatPercentage(results.roiPercentage)}
${t("annualizedROI")}: ${formatPercentage(results.annualizedROI)}
${t("paybackPeriod")}: ${formatPaybackPeriod(results.paybackPeriod)}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedInputs, t, isRTL]);

  // Result card data for sharing
  const resultCardInputs = useMemo(() => ({
    initialInvestment: { label: t("initialInvestment"), value: formatCurrency(parsedInputs.initialInvestment || 0) },
    expectedRevenue: { label: t("expectedRevenue"), value: formatCurrency(parsedInputs.expectedRevenue || 0) },
    timePeriod: { label: t("timePeriod"), value: `${parsedInputs.timePeriod || 0} ${t("months")}` },
    ongoingCosts: { label: t("ongoingCosts"), value: formatCurrency(parsedInputs.ongoingCosts || 0) },
  }), [parsedInputs, t]);

  const resultCardOutputs = useMemo(() => {
    if (!results) return {};
    return {
      netProfit: { label: t("netProfit"), value: formatCurrency(results.netProfit), highlight: !isNegativeROI },
      roiPercentage: { label: t("roiPercentage"), value: formatPercentage(results.roiPercentage), highlight: true },
      annualizedROI: { label: t("annualizedROI"), value: formatPercentage(results.annualizedROI) },
      paybackPeriod: { label: t("paybackPeriod"), value: formatPaybackPeriod(results.paybackPeriod) },
    };
  }, [results, t, isNegativeROI]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Initial Investment Input - Requirement 11.1 */}
          <div className="space-y-2">
            <Label htmlFor="initialInvestment">{t("initialInvestment")}</Label>
            <Input
              id="initialInvestment"
              type="number"
              min="0"
              step="0.01"
              placeholder="10000"
              value={initialInvestment}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInitialInvestment(e.target.value)}
            />
          </div>

          {/* Expected Revenue Input - Requirement 11.2 */}
          <div className="space-y-2">
            <Label htmlFor="expectedRevenue">{t("expectedRevenue")}</Label>
            <Input
              id="expectedRevenue"
              type="number"
              min="0"
              step="0.01"
              placeholder="15000"
              value={expectedRevenue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpectedRevenue(e.target.value)}
            />
          </div>

          {/* Time Period Input - Requirement 11.3 */}
          <div className="space-y-2">
            <Label htmlFor="timePeriod">{t("timePeriod")} ({t("months")})</Label>
            <Input
              id="timePeriod"
              type="number"
              min="1"
              step="1"
              placeholder="12"
              value={timePeriod}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimePeriod(e.target.value)}
            />
          </div>

          {/* Ongoing Costs Input - Requirement 11.4 */}
          <div className="space-y-2">
            <Label htmlFor="ongoingCosts">{t("ongoingCosts")}</Label>
            <Input
              id="ongoingCosts"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={ongoingCosts}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOngoingCosts(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>


      {/* Results Section */}
      {showResults && results && (
        <>
          {/* Warning for Negative ROI - Requirement 11.10 */}
          {isNegativeROI && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{t("negativeROIWarning")}</p>
                    <p className="text-sm">{t("lossAmount")}: {formatCurrency(results.lossAmount || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card 
            className={isNegativeROI ? "border-destructive" : "border-green-500"}
            role="region"
            aria-label={isRTL ? "نتائج الحساب" : "Calculation results"}
            aria-live="polite"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className={`h-5 w-5 ${isNegativeROI ? "text-destructive" : "text-green-500"}`} aria-hidden="true" />
                <span className={isNegativeROI ? "text-destructive" : "text-green-500"}>{t("results")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ROI Percentage - Requirement 11.6 */}
              <div className={`text-center p-6 rounded-lg ${isNegativeROI ? "bg-red-50 dark:bg-red-950" : "bg-green-50 dark:bg-green-950"}`}>
                <dt className="text-sm text-muted-foreground mb-2">{t("roiPercentage")}</dt>
                <dd className={`text-4xl font-bold ${isNegativeROI ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                  {formatPercentage(results.roiPercentage)}
                </dd>
              </div>

              {/* Other Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Net Profit - Requirement 11.5 */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("netProfit")}</dt>
                  <dd className={`text-2xl font-bold ${results.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(results.netProfit)}
                  </dd>
                </div>

                {/* Annualized ROI - Requirement 11.7 */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("annualizedROI")}</dt>
                  <dd className={`text-2xl font-bold ${results.annualizedROI >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatPercentage(results.annualizedROI)}
                  </dd>
                </div>

                {/* Payback Period - Requirement 11.8 */}
                <div className="text-center p-4 rounded-lg bg-muted md:col-span-2">
                  <dt className="text-sm text-muted-foreground mb-1">{t("paybackPeriod")}</dt>
                  <dd className="text-2xl font-bold text-blue-500">
                    {formatPaybackPeriod(results.paybackPeriod)}
                  </dd>
                </div>
              </div>

              {/* Summary - Requirement 11.9 */}
              <div className="p-4 rounded-lg bg-muted/50 text-sm">
                <p className="text-muted-foreground">
                  {isNegativeROI 
                    ? t("summaryNegative", { loss: formatCurrency(results.lossAmount || 0) })
                    : t("summaryPositive", { 
                        profit: formatCurrency(results.netProfit),
                        roi: formatPercentage(results.roiPercentage),
                        payback: formatPaybackPeriod(results.paybackPeriod)
                      })
                  }
                </p>
              </div>
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
      <SEOContent toolSlug="roiCalculator" />
    </div>
  );
}
