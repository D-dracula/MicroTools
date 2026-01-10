"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Package, AlertTriangle, Info } from "lucide-react";
import {
  calculateVolumetricWeight,
  formatWeight,
  formatDimensions,
  getFormulaExplanation,
  CARRIER_NAMES,
  type DimensionUnit,
  type WeightUnit,
} from "@/lib/calculators/volumetric-weight";
import { SEOContent, ResultCard, ShareButtons, ExportButtons } from "@/components/tools/shared";

/**
 * Volumetric Weight Calculator Component
 * Calculates volumetric weight and compares chargeable weight across carriers
 * Requirements: 2.1-2.11
 */
export function VolumetricCalculator() {
  const t = useTranslations("tools.volumetricCalculator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [actualWeight, setActualWeight] = useState<string>("");
  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>("cm");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");

  // Parse input values
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

  const parsedWeight = useMemo(() => {
    const val = parseFloat(actualWeight);
    return isNaN(val) || val <= 0 ? undefined : val;
  }, [actualWeight]);

  // Calculate results
  const results = useMemo(() => {
    if (
      parsedLength === undefined ||
      parsedWidth === undefined ||
      parsedHeight === undefined ||
      parsedWeight === undefined
    ) {
      return null;
    }
    return calculateVolumetricWeight({
      length: parsedLength,
      width: parsedWidth,
      height: parsedHeight,
      actualWeight: parsedWeight,
      unit: dimensionUnit,
      weightUnit,
    });
  }, [parsedLength, parsedWidth, parsedHeight, parsedWeight, dimensionUnit, weightUnit]);

  const hasValidInputs = results !== null;
  const hasAnyInput = length !== "" || width !== "" || height !== "" || actualWeight !== "";

  // Get carrier name based on locale
  const getCarrierName = useCallback((carrier: string) => {
    return isRTL ? CARRIER_NAMES[carrier]?.ar || carrier : CARRIER_NAMES[carrier]?.en || carrier;
  }, [isRTL]);

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results) return "";

    const carrierLines = results.carrierComparison
      .map((c) => `${getCarrierName(c.carrier)} (÷${c.divisor}): ${formatWeight(c.volumetricWeight)} → ${formatWeight(c.chargeableWeight)}`)
      .join("\n");

    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("dimensions")}: ${formatDimensions(parsedLength || 0, parsedWidth || 0, parsedHeight || 0, dimensionUnit)}
${t("actualWeight")}: ${parsedWeight} ${weightUnit}
━━━━━━━━━━━━━━━━━━
${t("volumetricWeight")}: ${formatWeight(results.volumetricWeight)}
${t("actualWeightKg")}: ${formatWeight(results.actualWeight)}
${t("chargeableWeight")}: ${formatWeight(results.chargeableWeight)}
${results.isVolumetricHigher ? `⚠️ ${t("volumetricHigherWarning")}` : ""}
━━━━━━━━━━━━━━━━━━
${t("carrierComparison")}:
${carrierLines}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedLength, parsedWidth, parsedHeight, parsedWeight, dimensionUnit, weightUnit, t, isRTL, getCarrierName]);

  // Export data
  const exportData = useMemo(() => {
    if (!results) return { inputs: {}, results: {} };

    return {
      inputs: {
        [t("dimensions")]: formatDimensions(parsedLength || 0, parsedWidth || 0, parsedHeight || 0, dimensionUnit),
        [t("actualWeight")]: `${parsedWeight} ${weightUnit}`,
      },
      results: {
        [t("volumetricWeight")]: formatWeight(results.volumetricWeight),
        [t("actualWeightKg")]: formatWeight(results.actualWeight),
        [t("chargeableWeight")]: formatWeight(results.chargeableWeight),
      },
      comparisonTable: {
        headers: [t("carrier"), t("divisor"), t("volumetricWeight"), t("chargeableWeight")],
        rows: results.carrierComparison.map((c) => [
          getCarrierName(c.carrier),
          c.divisor,
          formatWeight(c.volumetricWeight),
          formatWeight(c.chargeableWeight),
        ]),
      },
      metadata: {
        toolName: t("title"),
        date: new Date().toLocaleDateString(locale),
        locale,
      },
    };
  }, [results, parsedLength, parsedWidth, parsedHeight, parsedWeight, dimensionUnit, weightUnit, t, locale, getCarrierName]);

  // Result card data
  const resultCardInputs = useMemo(() => ({
    dimensions: { label: t("dimensions"), value: formatDimensions(parsedLength || 0, parsedWidth || 0, parsedHeight || 0, dimensionUnit) },
    actualWeight: { label: t("actualWeight"), value: `${parsedWeight || 0} ${weightUnit}` },
  }), [parsedLength, parsedWidth, parsedHeight, parsedWeight, dimensionUnit, weightUnit, t]);

  const resultCardOutputs = useMemo(() => {
    if (!results) return {};
    return {
      volumetricWeight: { label: t("volumetricWeight"), value: formatWeight(results.volumetricWeight) },
      chargeableWeight: { label: t("chargeableWeight"), value: formatWeight(results.chargeableWeight), highlight: true },
    };
  }, [results, t]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dimension Unit Toggle - Requirement 2.3 */}
          <div className="space-y-2">
            <Label>{t("dimensionUnit")}</Label>
            <div className="flex gap-2">
              {(["cm", "inch"] as DimensionUnit[]).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setDimensionUnit(unit)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                    dimensionUnit === unit
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50"
                  }`}
                  aria-pressed={dimensionUnit === unit}
                >
                  {unit === "cm" ? t("centimeters") : t("inches")}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions Input - Requirement 2.1 */}
          <div className="space-y-2">
            <Label>{t("dimensions")} ({dimensionUnit})</Label>
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

          {/* Weight Unit Toggle */}
          <div className="space-y-2">
            <Label>{t("weightUnit")}</Label>
            <div className="flex gap-2">
              {(["kg", "lb"] as WeightUnit[]).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setWeightUnit(unit)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                    weightUnit === unit
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50"
                  }`}
                  aria-pressed={weightUnit === unit}
                >
                  {unit === "kg" ? t("kilograms") : t("pounds")}
                </button>
              ))}
            </div>
          </div>

          {/* Actual Weight Input - Requirement 2.2 */}
          <div className="space-y-2">
            <Label htmlFor="actualWeight">{t("actualWeight")} ({weightUnit})</Label>
            <Input
              id="actualWeight"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={actualWeight}
              onChange={(e) => setActualWeight(e.target.value)}
              className="text-lg max-w-[200px]"
            />
          </div>

          {/* Formula Info */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">{t("formula")}</p>
              <p className="text-muted-foreground">{getFormulaExplanation()}</p>
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
                  <dt className="text-sm text-muted-foreground mb-1">{t("actualWeightKg")}</dt>
                  <dd className="text-xl font-bold">{formatWeight(results.actualWeight)}</dd>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("volumetricWeight")}</dt>
                  <dd className={`text-xl font-bold ${results.isVolumetricHigher ? "text-orange-500" : ""}`}>
                    {formatWeight(results.volumetricWeight)}
                  </dd>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/10 border-2 border-primary">
                  <dt className="text-sm text-muted-foreground mb-1">{t("chargeableWeight")}</dt>
                  <dd className="text-xl font-bold text-primary">
                    {formatWeight(results.chargeableWeight)}
                  </dd>
                </div>
              </dl>

              {/* Volumetric Higher Warning - Requirement 2.5 */}
              {results.isVolumetricHigher && (
                <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-700 dark:text-orange-400">{t("volumetricHigherWarning")}</p>
                    <p className="text-sm text-orange-600 dark:text-orange-500">{t("volumetricHigherExplanation")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Carrier Comparison Table - Requirement 2.4 */}
          <Card>
            <CardHeader>
              <CardTitle>{t("carrierComparison")}</CardTitle>
              <CardDescription>{t("carrierComparisonDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start p-3 font-medium">{t("carrier")}</th>
                      <th className="text-center p-3 font-medium">{t("divisor")}</th>
                      <th className="text-end p-3 font-medium">{t("volumetricWeight")}</th>
                      <th className="text-end p-3 font-medium">{t("chargeableWeight")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.carrierComparison.map((carrier) => {
                      const isHigher = carrier.volumetricWeight > results.actualWeight;
                      return (
                        <tr
                          key={carrier.carrier}
                          className={`border-b ${isHigher ? "bg-orange-50 dark:bg-orange-950/10" : ""}`}
                        >
                          <td className="p-3 font-medium">{getCarrierName(carrier.carrier)}</td>
                          <td className="p-3 text-center text-muted-foreground">÷ {carrier.divisor}</td>
                          <td className={`p-3 text-end ${isHigher ? "text-orange-600 dark:text-orange-400" : ""}`}>
                            {formatWeight(carrier.volumetricWeight)}
                          </td>
                          <td className="p-3 text-end font-bold">
                            {formatWeight(carrier.chargeableWeight)}
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

          {/* Share and Export Buttons - Requirements 2.8-2.11 */}
          <ShareButtons
            copyText={copyText}
          />
          
          <ExportButtons
            data={exportData}
            filename="volumetric-weight"
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

      {/* SEO Content - Requirements 2.6, 2.7 */}
      <SEOContent toolSlug="volumetricCalculator" />
    </div>
  );
}
