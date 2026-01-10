"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Percent, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3
} from "lucide-react";
import {
  simulateDiscountImpact,
  validateDiscountInput,
  formatCurrency,
  formatPercentage,
  formatUnits,
  type DiscountImpactInput,
  type DiscountImpactResult,
} from "@/lib/calculators/discount-impact";
import { SEOContent, ResultCard, ExportButtons, type ExportData } from "@/components/tools/shared";

/**
 * Discount Impact Simulator Component
 * Simulates the impact of discounts on profit margin and calculates break-even units
 * Requirements: 4.7
 */
export function DiscountImpactSimulator() {
  const t = useTranslations("tools.discountImpactSimulator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states
  const [originalPrice, setOriginalPrice] = useState<string>("");
  const [productCost, setProductCost] = useState<string>("");
  const [discountPercentage, setDiscountPercentage] = useState<string>("");
  const [currentMonthlySales, setCurrentMonthlySales] = useState<string>("");

  // Parse input values
  const parsedInputs = useMemo((): Partial<DiscountImpactInput> => ({
    originalPrice: parseFloat(originalPrice) || undefined,
    productCost: parseFloat(productCost) || undefined,
    discountPercentage: parseFloat(discountPercentage) || undefined,
    currentMonthlySales: parseFloat(currentMonthlySales) || undefined,
  }), [originalPrice, productCost, discountPercentage, currentMonthlySales]);

  // Validate inputs
  const validation = useMemo(() => {
    return validateDiscountInput(parsedInputs);
  }, [parsedInputs]);

  // Calculate results
  const results: DiscountImpactResult | null = useMemo(() => {
    if (!validation.isValid) return null;
    
    return simulateDiscountImpact({
      originalPrice: parsedInputs.originalPrice!,
      productCost: parsedInputs.productCost!,
      discountPercentage: parsedInputs.discountPercentage!,
      currentMonthlySales: parsedInputs.currentMonthlySales!,
    });
  }, [parsedInputs, validation.isValid]);

  const hasValidInputs = results !== null;
  const showResults = hasValidInputs && results;


  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results) return "";
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("originalPrice")}: ${formatCurrency(parsedInputs.originalPrice || 0)}
${t("productCost")}: ${formatCurrency(parsedInputs.productCost || 0)}
${t("discountPercentage")}: ${parsedInputs.discountPercentage}%
${t("currentMonthlySales")}: ${formatUnits(parsedInputs.currentMonthlySales || 0)}
━━━━━━━━━━━━━━━━━━
${t("originalMargin")}: ${formatPercentage(results.originalMargin)}
${t("discountedPrice")}: ${formatCurrency(results.discountedPrice)}
${t("discountedMargin")}: ${formatPercentage(results.discountedMargin)}
${t("breakEvenUnits")}: ${formatUnits(results.breakEvenUnits)}
${t("salesIncreaseNeeded")}: ${formatPercentage(results.salesIncreaseNeeded)}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedInputs, t, isRTL]);

  // Export data for buttons
  const exportData: ExportData = useMemo(() => ({
    inputs: {
      [t("originalPrice")]: formatCurrency(parsedInputs.originalPrice || 0),
      [t("productCost")]: formatCurrency(parsedInputs.productCost || 0),
      [t("discountPercentage")]: `${parsedInputs.discountPercentage || 0}%`,
      [t("currentMonthlySales")]: formatUnits(parsedInputs.currentMonthlySales || 0),
    },
    results: results ? {
      [t("originalMargin")]: formatPercentage(results.originalMargin),
      [t("discountedPrice")]: formatCurrency(results.discountedPrice),
      [t("discountedMargin")]: formatPercentage(results.discountedMargin),
      [t("marginReduction")]: formatPercentage(results.marginReduction),
      [t("breakEvenUnits")]: formatUnits(results.breakEvenUnits),
      [t("salesIncreaseNeeded")]: formatPercentage(results.salesIncreaseNeeded),
    } : {},
    metadata: {
      toolName: t("title"),
      date: new Date().toLocaleDateString(locale),
      locale,
    },
  }), [parsedInputs, results, t, locale]);

  // Result card data
  const resultCardInputs = useMemo(() => ({
    originalPrice: { 
      label: t("originalPrice"), 
      value: formatCurrency(parsedInputs.originalPrice || 0)
    },
    discountPercentage: { 
      label: t("discountPercentage"), 
      value: `${parsedInputs.discountPercentage || 0}%`
    },
  }), [parsedInputs, t]);

  const resultCardOutputs = useMemo(() => {
    if (!results) return {};
    return {
      breakEvenUnits: { 
        label: t("breakEvenUnits"), 
        value: formatUnits(results.breakEvenUnits), 
        highlight: true 
      },
      salesIncreaseNeeded: { 
        label: t("salesIncreaseNeeded"), 
        value: formatPercentage(results.salesIncreaseNeeded)
      },
    };
  }, [results, t]);


  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Original Price Input */}
            <div className="space-y-2">
              <Label htmlFor="originalPrice">{t("originalPrice")}</Label>
              <Input
                id="originalPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder={t("originalPricePlaceholder")}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("originalPriceHint")}</p>
            </div>

            {/* Product Cost Input */}
            <div className="space-y-2">
              <Label htmlFor="productCost">{t("productCost")}</Label>
              <Input
                id="productCost"
                type="number"
                min="0"
                step="0.01"
                placeholder={t("productCostPlaceholder")}
                value={productCost}
                onChange={(e) => setProductCost(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("productCostHint")}</p>
            </div>

            {/* Discount Percentage Input */}
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">{t("discountPercentage")}</Label>
              <Input
                id="discountPercentage"
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder={t("discountPercentagePlaceholder")}
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("discountPercentageHint")}</p>
            </div>

            {/* Current Monthly Sales Input */}
            <div className="space-y-2">
              <Label htmlFor="currentMonthlySales">{t("currentMonthlySales")}</Label>
              <Input
                id="currentMonthlySales"
                type="number"
                min="0"
                step="1"
                placeholder={t("currentMonthlySalesPlaceholder")}
                value={currentMonthlySales}
                onChange={(e) => setCurrentMonthlySales(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("currentMonthlySalesHint")}</p>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Results Section */}
      {showResults && results && (
        <>
          {/* Warning Card (if applicable) */}
          {results.warning && (
            <Card className={results.isViable ? "border-yellow-500" : "border-destructive"}>
              <CardContent className="pt-6">
                <div className={`p-4 rounded-lg ${results.isViable ? "bg-yellow-500/10" : "bg-destructive/10"}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${results.isViable ? "text-yellow-600 dark:text-yellow-500" : "text-destructive"}`} />
                    <div>
                      <p className={`font-medium ${results.isViable ? "text-yellow-600 dark:text-yellow-500" : "text-destructive"}`}>
                        {results.isViable ? t("cautionTitle") : t("warningTitle")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {results.warning}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Margin Comparison Card */}
          <Card role="region" aria-label={isRTL ? "مقارنة الهوامش" : "Margin Comparison"} aria-live="polite">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
                {t("marginComparison")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Margin Comparison Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Original Margin */}
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">{t("originalMargin")}</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-500">
                    {formatPercentage(results.originalMargin)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("priceLabel")}: {formatCurrency(parsedInputs.originalPrice || 0)}
                  </p>
                </div>

                {/* Discounted Margin */}
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">{t("discountedMargin")}</p>
                  <p className={`text-3xl font-bold ${results.discountedMargin > 0 ? "text-primary" : "text-destructive"}`}>
                    {formatPercentage(results.discountedMargin)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("priceLabel")}: {formatCurrency(results.discountedPrice)}
                  </p>
                </div>
              </div>

              {/* Margin Reduction */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-sm">{t("marginReduction")}</span>
                </div>
                <span className="font-medium text-destructive">
                  -{formatPercentage(results.marginReduction)}
                </span>
              </div>
            </CardContent>
          </Card>


          {/* Break-Even Analysis Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" aria-hidden="true" />
                {t("breakEvenAnalysis")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Break-Even Units */}
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{t("breakEvenUnits")}</span>
                </div>
                <span className="text-xl font-bold text-primary">
                  {formatUnits(results.breakEvenUnits)}
                </span>
              </div>

              {/* Sales Increase Needed */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t("salesIncreaseNeeded")}</span>
                </div>
                <span className={`font-medium ${results.salesIncreaseNeeded > 50 ? "text-destructive" : "text-primary"}`}>
                  +{formatPercentage(results.salesIncreaseNeeded)}
                </span>
              </div>

              {/* Explanation */}
              <p className="text-xs text-muted-foreground pt-2 border-t">
                {t("breakEvenExplanation", { 
                  units: formatUnits(results.breakEvenUnits),
                  increase: formatPercentage(results.salesIncreaseNeeded)
                })}
              </p>
            </CardContent>
          </Card>

          {/* Profit Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
                {t("profitComparisonTable")}
              </CardTitle>
              <CardDescription>{t("profitComparisonDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start py-2 px-2">{t("salesVolume")}</th>
                      <th className="text-end py-2 px-2">{t("originalProfit")}</th>
                      <th className="text-end py-2 px-2">{t("discountedProfit")}</th>
                      <th className="text-end py-2 px-2">{t("difference")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.profitComparison.map((row, index) => (
                      <tr 
                        key={index} 
                        className={`border-b ${
                          row.salesVolume === Math.ceil(results.breakEvenUnits) 
                            ? "bg-primary/10" 
                            : ""
                        }`}
                      >
                        <td className="py-2 px-2">
                          {formatUnits(row.salesVolume)}
                          {row.salesVolume === Math.ceil(results.breakEvenUnits) && (
                            <span className="text-xs text-primary ms-1">({t("breakEven")})</span>
                          )}
                        </td>
                        <td className="text-end py-2 px-2 text-green-600 dark:text-green-500">
                          {formatCurrency(row.originalProfit)}
                        </td>
                        <td className={`text-end py-2 px-2 ${row.discountedProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                          {formatCurrency(row.discountedProfit)}
                        </td>
                        <td className={`text-end py-2 px-2 ${row.difference >= 0 ? "text-green-600 dark:text-green-500" : "text-destructive"}`}>
                          {row.difference >= 0 ? "+" : ""}{formatCurrency(row.difference)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

          {/* Export Buttons */}
          <ExportButtons
            data={exportData}
            filename="discount-impact"
            title={t("title")}
            copyText={copyText}
          />
        </>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="discountImpactSimulator" />
    </div>
  );
}
