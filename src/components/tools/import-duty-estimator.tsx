"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Globe } from "lucide-react";
import {
  calculateImportDuty,
  formatNumber,
  formatPercentage,
  ALL_COUNTRIES,
  ALL_CATEGORIES,
  COUNTRY_NAMES,
  CATEGORY_NAMES,
  getDutyRate,
  getVATRate,
  type DestinationCountry,
  type ProductCategory,
} from "@/lib/calculators/import-duty";
import { SEOContent, ResultCard, ShareButtons } from "@/components/tools/shared";

/**
 * Import Duty Estimator Component
 * Calculates customs duties, VAT, and total landed cost for imports
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function ImportDutyEstimator() {
  const t = useTranslations("tools.importDutyEstimator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states - Requirements 4.1, 4.2, 4.3, 4.4, 4.5
  const [fobValue, setFobValue] = useState<string>("");
  const [shippingCost, setShippingCost] = useState<string>("");
  const [insuranceCost, setInsuranceCost] = useState<string>("");
  const [destinationCountry, setDestinationCountry] = useState<DestinationCountry>("saudi");
  const [productCategory, setProductCategory] = useState<ProductCategory>("general");

  // Parse input values
  const parsedFobValue = useMemo(() => {
    const val = parseFloat(fobValue);
    return isNaN(val) ? undefined : val;
  }, [fobValue]);
  
  const parsedShippingCost = useMemo(() => {
    const val = parseFloat(shippingCost);
    return isNaN(val) ? 0 : val;
  }, [shippingCost]);
  
  const parsedInsuranceCost = useMemo(() => {
    const val = parseFloat(insuranceCost);
    return isNaN(val) ? 0 : val;
  }, [insuranceCost]);

  // Calculate results in real-time
  const results = useMemo(() => {
    if (parsedFobValue === undefined) return null;
    return calculateImportDuty({
      fobValue: parsedFobValue,
      shippingCost: parsedShippingCost,
      insuranceCost: parsedInsuranceCost,
      destinationCountry,
      productCategory,
    });
  }, [parsedFobValue, parsedShippingCost, parsedInsuranceCost, destinationCountry, productCategory]);

  const hasValidInputs = results !== null;
  const showResults = hasValidInputs && results;
  const hasAnyInput = fobValue !== "";

  // Get current rates for display
  const currentDutyRate = getDutyRate(destinationCountry, productCategory);
  const currentVATRate = getVATRate(destinationCountry);

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results) return "";
    
    const countryName = isRTL ? COUNTRY_NAMES[destinationCountry].ar : COUNTRY_NAMES[destinationCountry].en;
    const categoryName = isRTL ? CATEGORY_NAMES[productCategory].ar : CATEGORY_NAMES[productCategory].en;
    
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("fobValue")}: ${formatNumber(results.breakdown.fob)}
${t("shippingCost")}: ${formatNumber(results.breakdown.shipping)}
${t("insuranceCost")}: ${formatNumber(results.breakdown.insurance)}
${t("destinationCountry")}: ${countryName}
${t("productCategory")}: ${categoryName}
━━━━━━━━━━━━━━━━━━
${t("cifValue")}: ${formatNumber(results.cifValue)}
${t("customsDuty")} (${formatPercentage(currentDutyRate)}): ${formatNumber(results.customsDuty)}
${t("vatAmount")} (${formatPercentage(currentVATRate)}): ${formatNumber(results.vatAmount)}
${t("totalLandedCost")}: ${formatNumber(results.totalLandedCost)}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, destinationCountry, productCategory, currentDutyRate, currentVATRate, t, isRTL]);

  // Result card data for sharing
  const resultCardInputs = useMemo(() => {
    const countryName = isRTL ? COUNTRY_NAMES[destinationCountry].ar : COUNTRY_NAMES[destinationCountry].en;
    const categoryName = isRTL ? CATEGORY_NAMES[productCategory].ar : CATEGORY_NAMES[productCategory].en;
    
    return {
      fobValue: { label: t("fobValue"), value: formatNumber(parsedFobValue || 0) },
      shippingCost: { label: t("shippingCost"), value: formatNumber(parsedShippingCost) },
      insuranceCost: { label: t("insuranceCost"), value: formatNumber(parsedInsuranceCost) },
      destinationCountry: { label: t("destinationCountry"), value: countryName },
      productCategory: { label: t("productCategory"), value: categoryName },
    };
  }, [parsedFobValue, parsedShippingCost, parsedInsuranceCost, destinationCountry, productCategory, t, isRTL]);

  const resultCardOutputs = useMemo((): Record<string, { label: string; value: string; highlight?: boolean }> => {
    if (!results) return {};
    return {
      cifValue: { label: t("cifValue"), value: formatNumber(results.cifValue) },
      customsDuty: { label: t("customsDuty"), value: formatNumber(results.customsDuty) },
      vatAmount: { label: t("vatAmount"), value: formatNumber(results.vatAmount) },
      totalLandedCost: { label: t("totalLandedCost"), value: formatNumber(results.totalLandedCost), highlight: true },
    };
  }, [results, t]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* FOB Value Input - Requirement 4.1 */}
          <div className="space-y-2">
            <Label htmlFor="fobValue">{t("fobValue")}</Label>
            <Input
              id="fobValue"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={fobValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFobValue(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Shipping Cost Input - Requirement 4.2 */}
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
              className="text-lg"
            />
          </div>

          {/* Insurance Cost Input - Requirement 4.3 */}
          <div className="space-y-2">
            <Label htmlFor="insuranceCost">{t("insuranceCost")}</Label>
            <Input
              id="insuranceCost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={insuranceCost}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInsuranceCost(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Destination Country Selection - Requirement 4.4 */}
          <div className="space-y-2">
            <Label>{t("destinationCountry")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_COUNTRIES.map((country) => {
                const isSelected = destinationCountry === country;
                return (
                  <button
                    key={country}
                    type={"button" as const}
                    onClick={() => setDestinationCountry(country)}
                    className={`p-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted hover:border-primary/50"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {isRTL ? COUNTRY_NAMES[country].ar : COUNTRY_NAMES[country].en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Category Selection - Requirement 4.5 */}
          <div className="space-y-2">
            <Label>{t("productCategory")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_CATEGORIES.map((category) => {
                const isSelected = productCategory === category;
                return (
                  <button
                    key={category}
                    type={"button" as const}
                    onClick={() => setProductCategory(category)}
                    className={`p-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted hover:border-primary/50"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {isRTL ? CATEGORY_NAMES[category].ar : CATEGORY_NAMES[category].en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Rates Display */}
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("dutyRate")}:</span>
              <span className="font-medium">{formatPercentage(currentDutyRate)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">{t("vatRate")}:</span>
              <span className="font-medium">{formatPercentage(currentVATRate)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && results && (
        <>
          {/* Main Results */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" aria-hidden="true" />
                {t("result")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CIF Value */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("cifValue")}</dt>
                  <dd className="text-2xl font-bold text-blue-500">
                    {formatNumber(results.cifValue)}
                  </dd>
                </div>

                {/* Customs Duty */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">
                    {t("customsDuty")} ({formatPercentage(currentDutyRate)})
                  </dt>
                  <dd className="text-2xl font-bold text-orange-500">
                    {formatNumber(results.customsDuty)}
                  </dd>
                </div>

                {/* VAT Amount */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">
                    {t("vatAmount")} ({formatPercentage(currentVATRate)})
                  </dt>
                  <dd className="text-2xl font-bold text-purple-500">
                    {formatNumber(results.vatAmount)}
                  </dd>
                </div>

                {/* Total Landed Cost */}
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800">
                  <dt className="text-sm text-muted-foreground mb-1">{t("totalLandedCost")}</dt>
                  <dd className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatNumber(results.totalLandedCost)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Breakdown Table - Requirement 4.10 */}
          <Card>
            <CardHeader>
              <CardTitle>{t("breakdown")}</CardTitle>
              <CardDescription>{t("breakdownDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start p-2 font-medium">{t("item")}</th>
                      <th className="text-end p-2 font-medium">{t("amount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">{t("fobValue")}</td>
                      <td className="p-2 text-end font-medium">{formatNumber(results.breakdown.fob)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{t("shippingCost")}</td>
                      <td className="p-2 text-end font-medium">{formatNumber(results.breakdown.shipping)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{t("insuranceCost")}</td>
                      <td className="p-2 text-end font-medium">{formatNumber(results.breakdown.insurance)}</td>
                    </tr>
                    <tr className="border-b bg-blue-50 dark:bg-blue-950/20">
                      <td className="p-2 font-medium">{t("cifValue")}</td>
                      <td className="p-2 text-end font-bold text-blue-500">{formatNumber(results.cifValue)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{t("customsDuty")} ({formatPercentage(currentDutyRate)})</td>
                      <td className="p-2 text-end font-medium text-orange-500">{formatNumber(results.breakdown.duty)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{t("vatAmount")} ({formatPercentage(currentVATRate)})</td>
                      <td className="p-2 text-end font-medium text-purple-500">{formatNumber(results.breakdown.vat)}</td>
                    </tr>
                    <tr className="bg-green-50 dark:bg-green-950/20">
                      <td className="p-2 font-bold">{t("totalLandedCost")}</td>
                      <td className="p-2 text-end font-bold text-green-600 dark:text-green-400">{formatNumber(results.totalLandedCost)}</td>
                    </tr>
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

          {/* Share Buttons */}
          <ShareButtons
            copyText={copyText}
          />
        </>
      )}

      {/* Validation Message */}
      {!hasValidInputs && hasAnyInput && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterValidFobValue")}
        </p>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="importDutyEstimator" />
    </div>
  );
}
