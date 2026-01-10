"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, AlertTriangle, Target, Users, MousePointer } from "lucide-react";
import {
  calculateAdBreakEven,
  formatNumber,
  formatCurrency,
  type AdBreakEvenOutputs,
} from "@/lib/calculators/ad-breakeven";
import { SEOContent, ResultCard, ShareButtons } from "@/components/tools/shared";

/**
 * Ad Break-Even Calculator Component
 * Calculates break-even point, required traffic, and maximum CPC for ad campaigns
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function AdBreakEvenCalculator() {
  const t = useTranslations("tools.adBreakEvenCalculator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states - Requirements 6.1, 6.2, 6.3, 6.4
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [productCost, setProductCost] = useState<string>("");
  const [adSpend, setAdSpend] = useState<string>("");
  const [conversionRate, setConversionRate] = useState<string>("");

  // Parse input values to numbers
  const parsedInputs = useMemo(() => ({
    sellingPrice: parseFloat(sellingPrice) || undefined,
    productCost: parseFloat(productCost) || undefined,
    adSpend: parseFloat(adSpend) || undefined,
    conversionRate: parseFloat(conversionRate) || undefined,
  }), [sellingPrice, productCost, adSpend, conversionRate]);

  // Calculate results in real-time
  const results = useMemo(() => {
    const { sellingPrice, productCost, adSpend, conversionRate } = parsedInputs;
    if (sellingPrice === undefined || productCost === undefined || 
        adSpend === undefined || conversionRate === undefined) {
      return null;
    }
    return calculateAdBreakEven({
      sellingPrice,
      productCost,
      adSpend,
      conversionRate,
    });
  }, [parsedInputs]);


  const hasValidInputs = results !== null;
  const showResults = hasValidInputs && results;
  const hasAnyInput = sellingPrice !== "" || productCost !== "" || adSpend !== "" || conversionRate !== "";

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results || !parsedInputs.sellingPrice) return "";
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("sellingPrice")}: ${formatCurrency(parsedInputs.sellingPrice!)}
${t("productCost")}: ${formatCurrency(parsedInputs.productCost!)}
${t("adSpend")}: ${formatCurrency(parsedInputs.adSpend!)}
${t("conversionRate")}: ${parsedInputs.conversionRate}%
━━━━━━━━━━━━━━━━━━
${t("profitPerSale")}: ${formatCurrency(results.profitPerSale)}
${t("breakEvenSales")}: ${formatNumber(results.breakEvenSales)}
${t("requiredTraffic")}: ${formatNumber(results.requiredTraffic)}
${t("maxCPC")}: ${formatCurrency(results.maxCPC)}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedInputs, t, isRTL]);

  // Result card data for sharing
  const resultCardInputs = useMemo(() => ({
    sellingPrice: { label: t("sellingPrice"), value: formatCurrency(parsedInputs.sellingPrice || 0) },
    productCost: { label: t("productCost"), value: formatCurrency(parsedInputs.productCost || 0) },
    adSpend: { label: t("adSpend"), value: formatCurrency(parsedInputs.adSpend || 0) },
    conversionRate: { label: t("conversionRate"), value: `${parsedInputs.conversionRate || 0}%` },
  }), [parsedInputs, t]);

  const resultCardOutputs = useMemo(() => {
    if (!results) return {};
    return {
      profitPerSale: { label: t("profitPerSale"), value: formatCurrency(results.profitPerSale), highlight: true },
      breakEvenSales: { label: t("breakEvenSales"), value: formatNumber(results.breakEvenSales) },
      requiredTraffic: { label: t("requiredTraffic"), value: formatNumber(results.requiredTraffic) },
      maxCPC: { label: t("maxCPC"), value: formatCurrency(results.maxCPC) },
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
          {/* Selling Price Input - Requirement 6.1 */}
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">{t("sellingPrice")}</Label>
            <Input
              id="sellingPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={sellingPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSellingPrice(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Product Cost Input - Requirement 6.2 */}
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

          {/* Ad Spend Input - Requirement 6.3 */}
          <div className="space-y-2">
            <Label htmlFor="adSpend">{t("adSpend")}</Label>
            <Input
              id="adSpend"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={adSpend}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdSpend(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Conversion Rate Input - Requirement 6.4 */}
          <div className="space-y-2">
            <Label htmlFor="conversionRate">{t("conversionRate")}</Label>
            <Input
              id="conversionRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="0"
              value={conversionRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConversionRate(e.target.value)}
              className="text-lg"
            />
          </div>
        </CardContent>
      </Card>


      {/* Results Section */}
      {showResults && results && (
        <>
          {/* Not Viable Warning - Requirement 6.10 */}
          {!results.isViable && (
            <Card className="border-destructive bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  <span className="font-medium">{t("notViableWarning")}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card 
            className={results.isViable ? "border-green-500" : "border-destructive"}
            role="region"
            aria-label={isRTL ? "نتائج الحساب" : "Calculation results"}
            aria-live="polite"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.isViable ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-green-500">{t("viable")}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
                    <span className="text-destructive">{t("notViable")}</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Profit Per Sale - Requirement 6.5 */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                    {t("profitPerSale")}
                  </dt>
                  <dd className={`text-2xl font-bold ${results.profitPerSale > 0 ? "text-green-500" : "text-destructive"}`}>
                    {formatCurrency(results.profitPerSale)}
                  </dd>
                </div>

                {/* Break-Even Sales - Requirement 6.6 */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    <Target className="h-4 w-4" aria-hidden="true" />
                    {t("breakEvenSales")}
                  </dt>
                  <dd className="text-2xl font-bold text-blue-500">
                    {formatNumber(results.breakEvenSales)}
                  </dd>
                </div>

                {/* Required Traffic - Requirement 6.7 */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    {t("requiredTraffic")}
                  </dt>
                  <dd className="text-2xl font-bold text-purple-500">
                    {formatNumber(results.requiredTraffic)}
                  </dd>
                </div>

                {/* Max CPC - Requirement 6.8 */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    <MousePointer className="h-4 w-4" aria-hidden="true" />
                    {t("maxCPC")}
                  </dt>
                  <dd className="text-2xl font-bold text-orange-500">
                    {formatCurrency(results.maxCPC)}
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
      <SEOContent toolSlug="adBreakEvenCalculator" />
    </div>
  );
}
