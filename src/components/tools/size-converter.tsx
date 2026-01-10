"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ruler, ArrowLeftRight } from "lucide-react";
import {
  convertSize,
  recommendSizeByMeasurement,
  getSizeComparisonTable,
  getAvailableSizes,
  formatMeasurementRange,
  formatMeasurement,
  CATEGORY_NAMES,
  SYSTEM_NAMES,
  ALL_CATEGORIES,
  ALL_SYSTEMS,
  type SizeCategory,
  type SizeSystem,
} from "@/lib/calculators/size-conversion";
import { SEOContent, ResultCard, ShareButtons, ExportButtons } from "@/components/tools/shared";

/**
 * Size Converter Component
 * Converts clothing and shoe sizes between Chinese and international systems
 * Requirements: 1.1-1.11
 */
export function SizeConverter() {
  const t = useTranslations("tools.sizeConverter");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states
  const [category, setCategory] = useState<SizeCategory>("men-clothing");
  const [sourceSystem, setSourceSystem] = useState<SizeSystem>("CN");
  const [selectedSize, setSelectedSize] = useState<string>("");
  
  // Measurement inputs for recommendation
  const [chest, setChest] = useState<string>("");
  const [waist, setWaist] = useState<string>("");
  const [hip, setHip] = useState<string>("");
  const [footLength, setFootLength] = useState<string>("");

  // Get available sizes for current category and system
  const availableSizes = useMemo(() => {
    return getAvailableSizes(category, sourceSystem);
  }, [category, sourceSystem]);

  // Reset selected size when category or system changes
  const handleCategoryChange = (newCategory: SizeCategory) => {
    setCategory(newCategory);
    setSelectedSize("");
    // Reset measurements
    setChest("");
    setWaist("");
    setHip("");
    setFootLength("");
  };

  const handleSystemChange = (newSystem: SizeSystem) => {
    setSourceSystem(newSystem);
    setSelectedSize("");
  };

  // Calculate conversion results
  const conversionResult = useMemo(() => {
    if (!selectedSize) return null;
    return convertSize({ category, sourceSystem, size: selectedSize });
  }, [category, sourceSystem, selectedSize]);

  // Calculate measurement-based recommendation
  const recommendation = useMemo(() => {
    const parsedChest = parseFloat(chest);
    const parsedWaist = parseFloat(waist);
    const parsedHip = parseFloat(hip);
    const parsedFootLength = parseFloat(footLength);

    return recommendSizeByMeasurement({
      category,
      chest: isNaN(parsedChest) ? undefined : parsedChest,
      waist: isNaN(parsedWaist) ? undefined : parsedWaist,
      hip: isNaN(parsedHip) ? undefined : parsedHip,
      footLength: isNaN(parsedFootLength) ? undefined : parsedFootLength,
    });
  }, [category, chest, waist, hip, footLength]);

  // Get comparison table
  const comparisonTable = useMemo(() => {
    return getSizeComparisonTable(category);
  }, [category]);

  const hasResults = conversionResult !== null;

  // Get category name based on locale
  const getCategoryName = useCallback((cat: SizeCategory) => {
    return isRTL ? CATEGORY_NAMES[cat].ar : CATEGORY_NAMES[cat].en;
  }, [isRTL]);

  // Get system name based on locale
  const getSystemName = useCallback((sys: SizeSystem) => {
    return isRTL ? SYSTEM_NAMES[sys].ar : SYSTEM_NAMES[sys].en;
  }, [isRTL]);

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!conversionResult) return "";

    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("category")}: ${getCategoryName(category)}
${t("sourceSize")}: ${selectedSize} (${getSystemName(sourceSystem)})
━━━━━━━━━━━━━━━━━━
${t("convertedSizes")}:
CN: ${conversionResult.CN}
US: ${conversionResult.US}
EU: ${conversionResult.EU}
UK: ${conversionResult.UK}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [conversionResult, category, selectedSize, sourceSystem, t, isRTL, getCategoryName, getSystemName]);

  // Export data
  const exportData = useMemo(() => {
    if (!conversionResult) return { inputs: {}, results: {} };

    return {
      inputs: {
        [t("category")]: getCategoryName(category),
        [t("sourceSystem")]: getSystemName(sourceSystem),
        [t("sourceSize")]: selectedSize,
      },
      results: {
        "CN": conversionResult.CN,
        "US": conversionResult.US,
        "EU": conversionResult.EU,
        "UK": conversionResult.UK,
      },
      comparisonTable: {
        headers: [isRTL ? "صيني" : "CN", isRTL ? "أمريكي" : "US", isRTL ? "أوروبي" : "EU", isRTL ? "بريطاني" : "UK"],
        rows: comparisonTable.rows,
      },
      metadata: {
        toolName: t("title"),
        date: new Date().toLocaleDateString(locale),
        locale,
      },
    };
  }, [conversionResult, category, sourceSystem, selectedSize, comparisonTable, t, locale, isRTL, getCategoryName, getSystemName]);

  // Result card data
  const resultCardInputs = useMemo(() => ({
    category: { label: t("category"), value: getCategoryName(category) },
    sourceSize: { label: t("sourceSize"), value: `${selectedSize} (${getSystemName(sourceSystem)})` },
  }), [category, selectedSize, sourceSystem, t, getCategoryName, getSystemName]);

  const resultCardOutputs = useMemo(() => {
    if (!conversionResult) return {};
    return {
      CN: { label: "CN (Chinese)", value: conversionResult.CN },
      US: { label: "US (American)", value: conversionResult.US },
      EU: { label: "EU (European)", value: conversionResult.EU },
      UK: { label: "UK (British)", value: conversionResult.UK, highlight: true },
    };
  }, [conversionResult]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection - Requirement 1.1 */}
          <div className="space-y-2">
            <Label>{t("category")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`p-2 rounded-lg border-2 transition-colors text-xs sm:text-sm font-medium ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted hover:border-primary/50"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {getCategoryName(cat)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source System Selection - Requirement 1.4 */}
          <div className="space-y-2">
            <Label>{t("sourceSystem")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {ALL_SYSTEMS.map((sys) => {
                const isSelected = sourceSystem === sys;
                return (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => handleSystemChange(sys)}
                    className={`p-2 rounded-lg border-2 transition-colors text-xs sm:text-sm font-medium ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted hover:border-primary/50"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {getSystemName(sys)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selection - Requirement 1.2 */}
          <div className="space-y-2">
            <Label>{t("selectSize")}</Label>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-2 rounded-lg border-2 transition-colors text-sm font-medium min-w-[50px] ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted hover:border-primary/50"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Measurement-based Recommendation - Requirement 1.3 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            {t("measurementRecommendation")}
          </CardTitle>
          <CardDescription>{t("measurementDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {category === "shoes" ? (
            <div className="space-y-2">
              <Label htmlFor="footLength">{t("footLength")} (cm)</Label>
              <Input
                id="footLength"
                type="number"
                min="15"
                max="35"
                step="0.5"
                placeholder="25.5"
                value={footLength}
                onChange={(e) => setFootLength(e.target.value)}
                className="max-w-[200px]"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chest">{t("chest")} (cm)</Label>
                <Input
                  id="chest"
                  type="number"
                  min="50"
                  max="150"
                  step="1"
                  placeholder="96"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waist">{t("waist")} (cm)</Label>
                <Input
                  id="waist"
                  type="number"
                  min="40"
                  max="130"
                  step="1"
                  placeholder="81"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                />
              </div>
              {(category === "women-clothing") && (
                <div className="space-y-2">
                  <Label htmlFor="hip">{t("hip")} (cm)</Label>
                  <Input
                    id="hip"
                    type="number"
                    min="60"
                    max="140"
                    step="1"
                    placeholder="94"
                    value={hip}
                    onChange={(e) => setHip(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {recommendation && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary">
              <p className="text-sm font-medium">
                {t("recommendedSize")}: <span className="text-lg font-bold text-primary">{recommendation.recommendedSize}</span>
                {" "}({getSystemName(recommendation.system)})
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {recommendation.confidence === "exact" ? t("exactMatch") : t("approximateMatch")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Results - Requirement 1.5 */}
      {hasResults && conversionResult && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("conversionResults")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {ALL_SYSTEMS.map((sys) => (
                  <div
                    key={sys}
                    className={`text-center p-4 rounded-lg ${
                      sys === sourceSystem
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-muted"
                    }`}
                  >
                    <dt className="text-sm text-muted-foreground mb-1">{getSystemName(sys)}</dt>
                    <dd className="text-2xl font-bold">{conversionResult[sys]}</dd>
                  </div>
                ))}
              </div>

              {conversionResult.measurementRange && (
                <div className="mt-4 p-4 rounded-lg bg-muted">
                  <h4 className="text-sm font-medium mb-2">{t("measurementRanges")}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                    {conversionResult.measurementRange.chest && (
                      <div>
                        <span className="text-muted-foreground">{t("chest")}: </span>
                        {formatMeasurementRange(conversionResult.measurementRange.chest)}
                      </div>
                    )}
                    {conversionResult.measurementRange.waist && (
                      <div>
                        <span className="text-muted-foreground">{t("waist")}: </span>
                        {formatMeasurementRange(conversionResult.measurementRange.waist)}
                      </div>
                    )}
                    {conversionResult.measurementRange.hip && (
                      <div>
                        <span className="text-muted-foreground">{t("hip")}: </span>
                        {formatMeasurementRange(conversionResult.measurementRange.hip)}
                      </div>
                    )}
                    {conversionResult.measurementRange.footLength && (
                      <div>
                        <span className="text-muted-foreground">{t("footLength")}: </span>
                        {formatMeasurement(conversionResult.measurementRange.footLength)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comparison Table - Requirement 1.5 */}
          <Card>
            <CardHeader>
              <CardTitle>{t("sizeChart")}</CardTitle>
              <CardDescription>{t("sizeChartDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b">
                      {comparisonTable.headers.map((header) => (
                        <th key={header} className="text-center p-3 font-medium">
                          {getSystemName(header)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonTable.rows.map((row, index) => {
                      const isCurrentSize = row[comparisonTable.headers.indexOf(sourceSystem)] === selectedSize;
                      return (
                        <tr
                          key={index}
                          className={`border-b ${isCurrentSize ? "bg-primary/10" : ""}`}
                        >
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className={`text-center p-3 ${isCurrentSize ? "font-bold" : ""}`}
                            >
                              {cell}
                            </td>
                          ))}
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

          {/* Share and Export Buttons - Requirements 1.8-1.11 */}
          <ShareButtons
            copyText={copyText}
          />
          
          <ExportButtons
            data={exportData}
            filename="size-conversion"
            title={t("title")}
            copyText={copyText}
          />
        </>
      )}

      {/* SEO Content - Requirement 1.6, 1.7 */}
      <SEOContent toolSlug="sizeConverter" />
    </div>
  );
}
