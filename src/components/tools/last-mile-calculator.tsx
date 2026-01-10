"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Package, AlertTriangle, Truck, DollarSign } from "lucide-react";
import {
  calculateLastMileCost,
  getProviderName,
  formatCurrency,
  REGION_NAMES,
  type DeliveryRegion,
} from "@/lib/calculators/last-mile-cost";
import { SEOContent, ResultCard, ShareButtons, ExportButtons } from "@/components/tools/shared";

/**
 * Last Mile Cost Calculator Component
 * Calculates last mile delivery costs for Saudi delivery providers
 * Requirements: 4.1-4.11
 */
export function LastMileCalculator() {
  const t = useTranslations("tools.lastMileCalculator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states
  const [weight, setWeight] = useState<string>("");
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [region, setRegion] = useState<DeliveryRegion>("city");

  // Parse input values
  const parsedWeight = useMemo(() => {
    const val = parseFloat(weight);
    return isNaN(val) || val <= 0 ? undefined : val;
  }, [weight]);

  const parsedLength = useMemo(() => {
    const val = parseFloat(length);
    return isNaN(val) || val <= 0 ? undefined : val;
  }, [length]);

  const parsedWidth = useMemo(() => {
    const val = parseFloat(width);
    return isNaN(val) || val <= 0 ? undefined : val;
  }, [width]);

  const parsedHeight = useMemo(() => {
    const val = parseFloat(height);
    return isNaN(val) || val <= 0 ? undefined : val;
  }, [height]);

  // Calculate results
  const results = useMemo(() => {
    if (
      parsedWeight === undefined ||
      parsedLength === undefined ||
      parsedWidth === undefined ||
      parsedHeight === undefined
    ) {
      return null;
    }
    return calculateLastMileCost({
      weight: parsedWeight,
      length: parsedLength,
      width: parsedWidth,
      height: parsedHeight,
      region,
    }, locale);
  }, [parsedWeight, parsedLength, parsedWidth, parsedHeight, region, locale]);

  const hasValidInputs = results !== null;
  const hasAnyInput = weight !== "" || length !== "" || width !== "" || height !== "";

  // Get region name based on locale
  const getRegionName = useCallback((r: DeliveryRegion) => {
    return isRTL ? REGION_NAMES[r].ar : REGION_NAMES[r].en;
  }, [isRTL]);


  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results) return "";

    const providerLines = results.providerComparison
      .map((p) => {
        const name = getProviderName(p.provider, locale);
        const badges = [];
        if (p.provider === results.cheapest) badges.push(isRTL ? "الأرخص" : "Cheapest");
        if (p.provider === results.fastest) badges.push(isRTL ? "الأسرع" : "Fastest");
        const badgeStr = badges.length > 0 ? ` [${badges.join(", ")}]` : "";
        return `${name}${badgeStr}: ${formatCurrency(p.totalCost, locale)} (${p.deliveryTime})`;
      })
      .join("\n");

    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("region")}: ${getRegionName(region)}
${t("weight")}: ${parsedWeight} kg
${t("dimensions")}: ${parsedLength} × ${parsedWidth} × ${parsedHeight} cm
━━━━━━━━━━━━━━━━━━
${t("chargeableWeight")}: ${results.chargeableWeight} kg
━━━━━━━━━━━━━━━━━━
${t("providerComparison")}:
${providerLines}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedWeight, parsedLength, parsedWidth, parsedHeight, region, t, locale, isRTL, getRegionName]);

  // Export data
  const exportData = useMemo(() => {
    if (!results) return { inputs: {}, results: {} };

    return {
      inputs: {
        [t("region")]: getRegionName(region),
        [t("weight")]: `${parsedWeight} kg`,
        [t("dimensions")]: `${parsedLength} × ${parsedWidth} × ${parsedHeight} cm`,
      },
      results: {
        [t("chargeableWeight")]: `${results.chargeableWeight} kg`,
        [t("volumetricWeight")]: `${results.volumetricWeight} kg`,
      },
      comparisonTable: {
        headers: [t("provider"), t("baseFee"), t("weightFee"), t("zoneSurcharge"), t("totalCost"), t("deliveryTime")],
        rows: results.providerComparison.map((p) => [
          getProviderName(p.provider, locale),
          formatCurrency(p.baseFee, locale),
          formatCurrency(p.weightFee, locale),
          formatCurrency(p.zoneSurcharge, locale),
          formatCurrency(p.totalCost, locale),
          p.deliveryTime,
        ]),
      },
      metadata: {
        toolName: t("title"),
        date: new Date().toLocaleDateString(locale),
        locale,
      },
    };
  }, [results, parsedWeight, parsedLength, parsedWidth, parsedHeight, region, t, locale, getRegionName]);

  // Result card data
  const resultCardInputs = useMemo(() => ({
    region: { label: t("region"), value: getRegionName(region) },
    weight: { label: t("weight"), value: `${parsedWeight || 0} kg` },
    dimensions: { label: t("dimensions"), value: `${parsedLength || 0} × ${parsedWidth || 0} × ${parsedHeight || 0} cm` },
  }), [parsedWeight, parsedLength, parsedWidth, parsedHeight, region, t, getRegionName]);

  const resultCardOutputs = useMemo(() => {
    if (!results) return {};
    const cheapestProvider = results.providerComparison.find(p => p.provider === results.cheapest);
    return {
      chargeableWeight: { label: t("chargeableWeight"), value: `${results.chargeableWeight} kg` },
      cheapestOption: { 
        label: t("cheapestOption"), 
        value: cheapestProvider ? `${getProviderName(cheapestProvider.provider, locale)}: ${formatCurrency(cheapestProvider.totalCost, locale)}` : '',
        highlight: true 
      },
    };
  }, [results, t, locale]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Region Selection - Requirement 4.1 */}
          <div className="space-y-2">
            <Label>{t("region")}</Label>
            <div className="flex flex-wrap gap-2">
              {(["city", "suburban", "remote"] as DeliveryRegion[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(r)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                    region === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50"
                  }`}
                  aria-pressed={region === r}
                >
                  {getRegionName(r)}
                </button>
              ))}
            </div>
          </div>

          {/* Weight Input */}
          <div className="space-y-2">
            <Label htmlFor="weight">{t("weight")} (kg)</Label>
            <Input
              id="weight"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="0.00"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="max-w-[200px]"
            />
          </div>

          {/* Dimensions Input */}
          <div className="space-y-2">
            <Label>{t("dimensions")} (cm)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Input
                  id="length"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder={t("length")}
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  aria-label={t("length")}
                />
              </div>
              <div>
                <Input
                  id="width"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder={t("width")}
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  aria-label={t("width")}
                />
              </div>
              <div>
                <Input
                  id="height"
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder={t("height")}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  aria-label={t("height")}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Results Section */}
      {hasValidInputs && results && (
        <>
          {/* Weight Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" aria-hidden="true" />
                {t("weightSummary")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("actualWeight")}</dt>
                  <dd className="text-xl font-bold">{results.actualWeight} kg</dd>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("volumetricWeight")}</dt>
                  <dd className={`text-xl font-bold ${results.volumetricWeight > results.actualWeight ? "text-orange-500" : ""}`}>
                    {results.volumetricWeight} kg
                  </dd>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/10 border-2 border-primary">
                  <dt className="text-sm text-muted-foreground mb-1">{t("chargeableWeight")}</dt>
                  <dd className="text-xl font-bold text-primary">
                    {results.chargeableWeight} kg
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Warnings - Requirement 4.5 */}
          {results.warnings.length > 0 && (
            <div className="space-y-2">
              {results.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"
                >
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <p className="text-sm text-orange-700 dark:text-orange-400">{warning}</p>
                </div>
              ))}
            </div>
          )}

          {/* Provider Comparison Table - Requirement 4.3 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" aria-hidden="true" />
                {t("providerComparison")}
              </CardTitle>
              <CardDescription>{t("providerComparisonDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start p-3 font-medium">{t("provider")}</th>
                      <th className="text-end p-3 font-medium">{t("baseFee")}</th>
                      <th className="text-end p-3 font-medium">{t("weightFee")}</th>
                      <th className="text-end p-3 font-medium">{t("zoneSurcharge")}</th>
                      <th className="text-end p-3 font-medium">{t("totalCost")}</th>
                      <th className="text-center p-3 font-medium">{t("deliveryTime")}</th>
                      <th className="text-center p-3 font-medium">{t("badges")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.providerComparison.map((provider) => {
                      const isCheapest = provider.provider === results.cheapest;
                      const isFastest = provider.provider === results.fastest;
                      return (
                        <tr
                          key={provider.provider}
                          className={`border-b ${isCheapest ? "bg-green-50 dark:bg-green-950/10" : ""}`}
                        >
                          <td className="p-3 font-medium">{getProviderName(provider.provider, locale)}</td>
                          <td className="p-3 text-end text-muted-foreground">
                            {formatCurrency(provider.baseFee, locale)}
                          </td>
                          <td className="p-3 text-end text-muted-foreground">
                            {formatCurrency(provider.weightFee, locale)}
                          </td>
                          <td className="p-3 text-end text-muted-foreground">
                            {formatCurrency(provider.zoneSurcharge, locale)}
                          </td>
                          <td className="p-3 text-end font-bold">
                            {formatCurrency(provider.totalCost, locale)}
                          </td>
                          <td className="p-3 text-center">{provider.deliveryTime}</td>
                          <td className="p-3 text-center">
                            <div className="flex flex-wrap justify-center gap-1">
                              {isCheapest && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <DollarSign className="h-3 w-3 mr-0.5" />
                                  {t("cheapest")}
                                </span>
                              )}
                              {isFastest && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  <Truck className="h-3 w-3 mr-0.5" />
                                  {t("fastest")}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Shareable Result Card (hidden) */}
          <div className="sr-only">
            <ResultCard
              ref={resultCardRef}
              toolName={t("title")}
              inputs={resultCardInputs}
              outputs={resultCardOutputs}
            />
          </div>

          {/* Share and Export Buttons - Requirements 4.8-4.11 */}
          <ShareButtons
            copyText={copyText}
          />
          
          <ExportButtons
            data={exportData}
            filename="last-mile-cost"
            title={t("title")}
            copyText={copyText}
          />
        </>
      )}

      {/* Validation Message */}
      {!hasValidInputs && hasAnyInput && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterValidInputs")}
        </p>
      )}

      {/* SEO Content - Requirements 4.6, 4.7 */}
      <SEOContent toolSlug="lastMileCalculator" />
    </div>
  );
}
