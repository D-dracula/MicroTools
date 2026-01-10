"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Tag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  calculateFairPricing,
  formatCurrency,
  formatPercentage,
  PRICING_PRESETS,
  type PricingPreset,
} from "@/lib/calculators/fair-pricing";
import { SEOContent, ResultCard, ShareButtons } from "@/components/tools/shared";

/**
 * Fair Product Pricing Calculator Component
 * Calculates fair selling price for beginners
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.11
 */
export function FairPricingCalculator() {
  const t = useTranslations("tools.fairPricingCalculator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states - Requirements 10.1, 10.2, 10.3, 10.4, 10.5
  const [productCost, setProductCost] = useState<string>("");
  const [desiredMargin, setDesiredMargin] = useState<string>("");
  const [shippingCost, setShippingCost] = useState<string>("0");
  const [gatewayFee, setGatewayFee] = useState<string>("");
  const [platformFee, setPlatformFee] = useState<string>("0");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Parse input values to numbers
  const parsedInputs = useMemo(() => ({
    productCost: parseFloat(productCost) || undefined,
    desiredMargin: parseFloat(desiredMargin) || undefined,
    shippingCost: parseFloat(shippingCost) || 0,
    gatewayFee: parseFloat(gatewayFee) || undefined,
    platformFee: parseFloat(platformFee) || 0,
  }), [productCost, desiredMargin, shippingCost, gatewayFee, platformFee]);

  // Calculate results in real-time
  const results = useMemo(() => {
    const { productCost: pc, desiredMargin: dm, shippingCost: sc, gatewayFee: gf, platformFee: pf } = parsedInputs;
    if (pc === undefined || dm === undefined || gf === undefined) {
      return null;
    }
    return calculateFairPricing({
      productCost: pc,
      desiredMargin: dm,
      shippingCost: sc,
      gatewayFee: gf,
      platformFee: pf,
    });
  }, [parsedInputs]);

  // Apply preset - Requirement 10.11
  const applyPreset = (preset: PricingPreset) => {
    setDesiredMargin(preset.desiredMargin.toString());
    setGatewayFee(preset.gatewayFee.toString());
    setPlatformFee(preset.platformFee.toString());
    setSelectedPreset(preset.id);
  };

  const hasValidInputs = results !== null && results.isValid;
  const showResults = hasValidInputs && results;
  const hasAnyInput = productCost !== "" || desiredMargin !== "" || gatewayFee !== "";
  const hasError = results !== null && !results.isValid;

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results || !results.isValid) return "";
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("productCost")}: ${formatCurrency(parsedInputs.productCost || 0)}
${t("shippingCost")}: ${formatCurrency(parsedInputs.shippingCost || 0)}
${t("desiredMargin")}: ${formatPercentage(parsedInputs.desiredMargin || 0)}
${t("gatewayFee")}: ${formatPercentage(parsedInputs.gatewayFee || 0)}
${t("platformFee")}: ${formatPercentage(parsedInputs.platformFee || 0)}
━━━━━━━━━━━━━━━━━━
${t("recommendedPrice")}: ${formatCurrency(results.recommendedPrice)}
${t("profitPerSale")}: ${formatCurrency(results.profitPerSale)}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedInputs, t, isRTL]);

  // Result card data for sharing
  const resultCardInputs = useMemo(() => ({
    productCost: { label: t("productCost"), value: formatCurrency(parsedInputs.productCost || 0) },
    shippingCost: { label: t("shippingCost"), value: formatCurrency(parsedInputs.shippingCost || 0) },
    desiredMargin: { label: t("desiredMargin"), value: formatPercentage(parsedInputs.desiredMargin || 0) },
    gatewayFee: { label: t("gatewayFee"), value: formatPercentage(parsedInputs.gatewayFee || 0) },
    platformFee: { label: t("platformFee"), value: formatPercentage(parsedInputs.platformFee || 0) },
  }), [parsedInputs, t]);

  const resultCardOutputs = useMemo((): Record<
    string,
    { label: string; value: string; highlight?: boolean }
  > => {
    if (!results || !results.isValid) return {};
    return {
      recommendedPrice: { label: t("recommendedPrice"), value: formatCurrency(results.recommendedPrice), highlight: true },
      profitPerSale: { label: t("profitPerSale"), value: formatCurrency(results.profitPerSale) },
    };
  }, [results, t]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Suggestions - Requirement 10.11 */}
          <div className="space-y-2">
            <Label>{t("presets")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRICING_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  variant={selectedPreset === preset.id ? "default" : "outline"}
                  className="text-sm h-auto py-2"
                  onClick={() => applyPreset(preset)}
                  aria-pressed={selectedPreset === preset.id}
                >
                  {t(preset.nameKey)}
                </Button>
              ))}
            </div>
          </div>

          {/* Product Cost Input - Requirement 10.1 */}
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
            />
          </div>

          {/* Shipping Cost Input - Requirement 10.3 */}
          <div className="space-y-2">
            <Label htmlFor="shippingCost">{t("shippingCost")}</Label>
            <Input
              id="shippingCost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={shippingCost}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShippingCost(e.target.value)}
            />
          </div>

          {/* Desired Margin Input - Requirement 10.2 */}
          <div className="space-y-2">
            <Label htmlFor="desiredMargin">{t("desiredMargin")} (%)</Label>
            <Input
              id="desiredMargin"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="30"
              value={desiredMargin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setDesiredMargin(e.target.value);
                setSelectedPreset(null);
              }}
            />
          </div>

          {/* Gateway Fee Input - Requirement 10.4 */}
          <div className="space-y-2">
            <Label htmlFor="gatewayFee">{t("gatewayFee")} (%)</Label>
            <Input
              id="gatewayFee"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="2.5"
              value={gatewayFee}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setGatewayFee(e.target.value);
                setSelectedPreset(null);
              }}
            />
          </div>

          {/* Platform Fee Input - Requirement 10.5 */}
          <div className="space-y-2">
            <Label htmlFor="platformFee">{t("platformFee")} (%)</Label>
            <Input
              id="platformFee"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="0"
              value={platformFee}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setPlatformFee(e.target.value);
                setSelectedPreset(null);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Message - Requirement 10.10 */}
      {hasError && results && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              <p className="font-medium">{t("feeExceedsError")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {showResults && results && (
        <>
          <Card 
            className="border-green-500"
            role="region"
            aria-label={isRTL ? "نتائج الحساب" : "Calculation results"}
            aria-live="polite"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-green-500" aria-hidden="true" />
                <span className="text-green-500">{t("results")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Results */}
              <div className="text-center p-6 rounded-lg bg-green-50 dark:bg-green-950">
                <dt className="text-sm text-muted-foreground mb-2">{t("recommendedPrice")}</dt>
                <dd className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(results.recommendedPrice)}
                </dd>
              </div>

              {/* Profit Per Sale - Requirement 10.8 */}
              <div className="text-center p-4 rounded-lg bg-muted">
                <dt className="text-sm text-muted-foreground mb-1">{t("profitPerSale")}</dt>
                <dd className="text-2xl font-bold text-green-500">
                  {formatCurrency(results.profitPerSale)}
                </dd>
              </div>

              {/* Breakdown Table - Requirement 10.9 */}
              <div className="space-y-2">
                <h4 className="font-medium">{t("breakdown")}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" role="table">
                    <thead>
                      <tr className="border-b">
                        <th className="text-start p-2">{t("item")}</th>
                        <th className="text-end p-2">{t("amount")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">{t("productCost")}</td>
                        <td className="text-end p-2">{formatCurrency(results.breakdown.productCost)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">{t("shippingCost")}</td>
                        <td className="text-end p-2">{formatCurrency(results.breakdown.shippingCost)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">{t("gatewayFeeAmount")}</td>
                        <td className="text-end p-2">{formatCurrency(results.breakdown.gatewayFeeAmount)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">{t("platformFeeAmount")}</td>
                        <td className="text-end p-2">{formatCurrency(results.breakdown.platformFeeAmount)}</td>
                      </tr>
                      <tr className="border-b bg-green-50 dark:bg-green-950/30">
                        <td className="p-2 font-medium">{t("profit")}</td>
                        <td className="text-end p-2 font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(results.breakdown.profit)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="font-bold bg-muted">
                        <td className="p-2">{t("recommendedPrice")}</td>
                        <td className="text-end p-2 text-green-600 dark:text-green-400">
                          {formatCurrency(results.recommendedPrice)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
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
      {!hasValidInputs && !hasError && hasAnyInput && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterValidNumbers")}
        </p>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="fairPricingCalculator" />
    </div>
  );
}
