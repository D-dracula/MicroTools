"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Package, Info } from "lucide-react";
import {
  convertWeight,
  formatWeight,
  getUnitName,
  getCategoryName,
  getCategoryDescription,
  getReferenceName,
  PRODUCT_REFERENCES,
  UNIT_NAMES,
  ALL_UNITS,
  type WeightUnit,
} from "@/lib/calculators/weight-conversion";
import { SEOContent, ResultCard, ShareButtons, ExportButtons } from "@/components/tools/shared";

/**
 * Weight Converter Component
 * Converts weights between grams, ounces, pounds, and kilograms
 * Requirements: 5.1-5.11
 */
export function WeightConverter() {
  const t = useTranslations("tools.weightConverter");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states
  const [inputValue, setInputValue] = useState<string>("");
  const [inputUnit, setInputUnit] = useState<WeightUnit>("g");

  // Parse input value
  const parsedValue = useMemo(() => {
    const value = parseFloat(inputValue);
    return isNaN(value) || value <= 0 ? undefined : value;
  }, [inputValue]);

  // Calculate results
  const result = useMemo(() => {
    if (parsedValue === undefined) return null;
    return convertWeight({ value: parsedValue, unit: inputUnit });
  }, [parsedValue, inputUnit]);

  const hasValidInput = result !== null;
  const hasAnyInput = inputValue !== "";

  // Get category color based on weight
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "light":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700";
      case "heavy":
        return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";
      default:
        return "bg-muted";
    }
  };

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!result) return "";

    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("input")}: ${formatWeight(parsedValue!, inputUnit)}

${t("conversions")}:
  ${getUnitName("g", locale)}: ${formatWeight(result.grams, "g")}
  ${getUnitName("oz", locale)}: ${formatWeight(result.ounces, "oz")}
  ${getUnitName("lb", locale)}: ${formatWeight(result.pounds, "lb")}
  ${getUnitName("kg", locale)}: ${formatWeight(result.kilograms, "kg")}

${t("shippingCategory")}: ${getCategoryName(result.shippingCategory, locale)}
${result.reference ? `${t("similarTo")}: ${result.reference}` : ""}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [result, parsedValue, inputUnit, t, locale, isRTL]);

  // Export data
  const exportData = useMemo(() => {
    if (!result) return { inputs: {}, results: {} };

    return {
      inputs: {
        [t("inputValue")]: `${parsedValue} ${UNIT_NAMES[inputUnit].symbol}`,
        [t("inputUnit")]: getUnitName(inputUnit, locale),
      },
      results: {
        [getUnitName("g", locale)]: `${result.grams} g`,
        [getUnitName("oz", locale)]: `${result.ounces} oz`,
        [getUnitName("lb", locale)]: `${result.pounds} lb`,
        [getUnitName("kg", locale)]: `${result.kilograms} kg`,
        [t("shippingCategory")]: getCategoryName(result.shippingCategory, locale),
      },
      metadata: {
        toolName: t("title"),
        date: new Date().toLocaleDateString(locale),
        locale,
      },
    };
  }, [result, parsedValue, inputUnit, t, locale]);

  // Result card data for sharing
  const resultCardInputs = useMemo(() => ({
    inputWeight: {
      label: t("inputWeight"),
      value: parsedValue ? formatWeight(parsedValue, inputUnit) : "",
    },
  }), [parsedValue, inputUnit, t]);

  const resultCardOutputs = useMemo((): Record<
    string,
    { label: string; value: string; highlight?: boolean }
  > => {
    if (!result) return {};
    return {
      grams: { label: getUnitName("g", locale), value: formatWeight(result.grams, "g") },
      ounces: { label: getUnitName("oz", locale), value: formatWeight(result.ounces, "oz") },
      pounds: { label: getUnitName("lb", locale), value: formatWeight(result.pounds, "lb") },
      kilograms: { label: getUnitName("kg", locale), value: formatWeight(result.kilograms, "kg"), highlight: true },
      category: { label: t("shippingCategory"), value: getCategoryName(result.shippingCategory, locale) },
    };
  }, [result, t, locale]);

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
          {/* Weight Input */}
          <div className="space-y-2">
            <Label htmlFor="weight-input">{t("enterWeight")}</Label>
            <Input
              id="weight-input"
              type="number"
              min="0.001"
              step="0.001"
              placeholder={t("weightPlaceholder")}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              aria-label={t("enterWeight")}
            />
          </div>

          {/* Unit Selection - Requirement 5.1, 5.2 */}
          <div className="space-y-2">
            <Label>{t("selectUnit")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {ALL_UNITS.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setInputUnit(unit)}
                  className={`px-3 py-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                    inputUnit === unit
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50"
                  }`}
                  aria-pressed={inputUnit === unit}
                >
                  <span className="block font-bold">{UNIT_NAMES[unit].symbol}</span>
                  <span className="block text-xs text-muted-foreground">
                    {getUnitName(unit, locale)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Conversion Formula Info */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">{t("conversionFormulas")}</p>
              <p className="text-muted-foreground text-xs mt-1">
                1 oz = 28.35 g | 1 lb = 453.6 g | 1 kg = 1000 g
              </p>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Results Section */}
      {hasValidInput && result && (
        <>
          {/* All Units Display - Requirement 5.1, 5.2, 5.3 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("conversionResults")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {/* Grams */}
                <div className={`p-4 rounded-lg ${inputUnit === "g" ? "bg-primary/10 border-2 border-primary" : "bg-muted"}`}>
                  <dt className="text-sm text-muted-foreground mb-1">{getUnitName("g", locale)}</dt>
                  <dd className={`text-xl font-bold ${inputUnit === "g" ? "text-primary" : ""}`}>
                    {formatWeight(result.grams, "g", 2)}
                  </dd>
                </div>

                {/* Ounces */}
                <div className={`p-4 rounded-lg ${inputUnit === "oz" ? "bg-primary/10 border-2 border-primary" : "bg-muted"}`}>
                  <dt className="text-sm text-muted-foreground mb-1">{getUnitName("oz", locale)}</dt>
                  <dd className={`text-xl font-bold ${inputUnit === "oz" ? "text-primary" : ""}`}>
                    {formatWeight(result.ounces, "oz", 3)}
                  </dd>
                </div>

                {/* Pounds */}
                <div className={`p-4 rounded-lg ${inputUnit === "lb" ? "bg-primary/10 border-2 border-primary" : "bg-muted"}`}>
                  <dt className="text-sm text-muted-foreground mb-1">{getUnitName("lb", locale)}</dt>
                  <dd className={`text-xl font-bold ${inputUnit === "lb" ? "text-primary" : ""}`}>
                    {formatWeight(result.pounds, "lb", 3)}
                  </dd>
                </div>

                {/* Kilograms */}
                <div className={`p-4 rounded-lg ${inputUnit === "kg" ? "bg-primary/10 border-2 border-primary" : "bg-muted"}`}>
                  <dt className="text-sm text-muted-foreground mb-1">{getUnitName("kg", locale)}</dt>
                  <dd className={`text-xl font-bold ${inputUnit === "kg" ? "text-primary" : ""}`}>
                    {formatWeight(result.kilograms, "kg", 3)}
                  </dd>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Category - Requirement 5.5 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-primary" aria-hidden="true" />
                {t("shippingCategory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg border-2 ${getCategoryColor(result.shippingCategory)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">
                      {getCategoryName(result.shippingCategory, locale)}
                    </p>
                    <p className="text-sm opacity-80 mt-1">
                      {getCategoryDescription(result.shippingCategory, locale)}
                    </p>
                  </div>
                  <div className="text-3xl">
                    {result.shippingCategory === "light" && "🪶"}
                    {result.shippingCategory === "medium" && "📦"}
                    {result.shippingCategory === "heavy" && "🏋️"}
                  </div>
                </div>
              </div>

              {/* Category Thresholds */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-green-100 dark:bg-green-900/30">
                  <p className="font-medium text-green-800 dark:text-green-400">{t("light")}</p>
                  <p className="text-green-600 dark:text-green-500">&lt; 500g</p>
                </div>
                <div className="p-2 rounded bg-yellow-100 dark:bg-yellow-900/30">
                  <p className="font-medium text-yellow-800 dark:text-yellow-400">{t("medium")}</p>
                  <p className="text-yellow-600 dark:text-yellow-500">500g - 2kg</p>
                </div>
                <div className="p-2 rounded bg-red-100 dark:bg-red-900/30">
                  <p className="font-medium text-red-800 dark:text-red-400">{t("heavy")}</p>
                  <p className="text-red-600 dark:text-red-500">&gt; 2kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Weight References - Requirement 5.4 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("productReferences")}</CardTitle>
              <CardDescription>{t("productReferencesDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start p-3 font-medium">{t("product")}</th>
                      <th className="text-center p-3 font-medium">{t("weightGrams")}</th>
                      <th className="text-center p-3 font-medium">{t("weightOunces")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRODUCT_REFERENCES.map((ref) => (
                      <tr 
                        key={ref.name} 
                        className={`border-b ${
                          result.reference === ref.name 
                            ? "bg-primary/10 font-medium" 
                            : ""
                        }`}
                      >
                        <td className="p-3">{getReferenceName(ref, locale)}</td>
                        <td className="p-3 text-center">{ref.weightGrams.toFixed(1)} g</td>
                        <td className="p-3 text-center">{(ref.weightGrams / 28.3495).toFixed(2)} oz</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Similar Product Indicator */}
              {result.reference && (
                <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary">
                  <p className="text-sm">
                    <span className="font-medium">{t("similarTo")}: </span>
                    {result.reference}
                  </p>
                </div>
              )}
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

          {/* Share and Export Buttons - Requirements 5.8-5.11 */}
          <ShareButtons
            copyText={copyText}
          />
          
          <ExportButtons
            data={exportData}
            filename="weight-conversion"
            title={t("title")}
            copyText={copyText}
          />
        </>
      )}

      {/* Validation Message */}
      {!hasValidInput && hasAnyInput && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterValidWeight")}
        </p>
      )}

      {/* SEO Content - Requirements 5.6, 5.7 */}
      <SEOContent toolSlug="weightConverter" />
    </div>
  );
}
