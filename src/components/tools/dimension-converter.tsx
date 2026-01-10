"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Box, ArrowLeftRight, Plus, Trash2, Package } from "lucide-react";
import {
  convertDimensions,
  convertBatchDimensions,
  formatDimensions,
  formatVolume,
  getConversionFormula,
  COMMON_BOX_SIZES,
  BOX_SIZE_NAMES,
  type DimensionUnit,
  type DimensionInput,
} from "@/lib/calculators/dimension-conversion";
import { SEOContent, ResultCard, ShareButtons, ExportButtons } from "@/components/tools/shared";

interface BoxInput {
  id: string;
  length: string;
  width: string;
  height: string;
}

/**
 * Dimension Converter Component
 * Converts carton dimensions between cm and inches with volume calculation
 * Requirements: 3.1-3.11
 */
export function DimensionConverter() {
  const t = useTranslations("tools.dimensionConverter");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states
  const [unit, setUnit] = useState<DimensionUnit>("cm");
  const [boxes, setBoxes] = useState<BoxInput[]>([
    { id: "1", length: "", width: "", height: "" },
  ]);

  // Parse box inputs
  const parsedBoxes = useMemo(() => {
    return boxes.map((box) => {
      const length = parseFloat(box.length);
      const width = parseFloat(box.width);
      const height = parseFloat(box.height);
      
      return {
        length: isNaN(length) || length <= 0 ? undefined : length,
        width: isNaN(width) || width <= 0 ? undefined : width,
        height: isNaN(height) || height <= 0 ? undefined : height,
        unit,
      };
    });
  }, [boxes, unit]);

  // Check if we have valid inputs
  const validBoxes = useMemo(() => {
    return parsedBoxes.filter(
      (box) => box.length !== undefined && box.width !== undefined && box.height !== undefined
    ) as DimensionInput[];
  }, [parsedBoxes]);

  // Calculate results
  const results = useMemo(() => {
    if (validBoxes.length === 0) return null;
    
    if (validBoxes.length === 1) {
      const result = convertDimensions(validBoxes[0]);
      return result ? { results: [result], totalVolumeCm: result.cm.volume, totalVolumeInch: result.inch.volume } : null;
    }
    
    return convertBatchDimensions({ boxes: validBoxes });
  }, [validBoxes]);

  const hasValidInputs = results !== null && results.results.length > 0;
  const hasAnyInput = boxes.some((box) => box.length !== "" || box.width !== "" || box.height !== "");
  const isBatchMode = boxes.length > 1;

  // Box management functions
  const addBox = () => {
    setBoxes([...boxes, { id: Date.now().toString(), length: "", width: "", height: "" }]);
  };

  const removeBox = (id: string) => {
    if (boxes.length > 1) {
      setBoxes(boxes.filter((box) => box.id !== id));
    }
  };

  const updateBox = (id: string, field: keyof BoxInput, value: string) => {
    setBoxes(boxes.map((box) => (box.id === id ? { ...box, [field]: value } : box)));
  };

  // Get box size name based on locale
  const getBoxSizeName = useCallback((name: string) => {
    return isRTL ? BOX_SIZE_NAMES[name]?.ar || name : BOX_SIZE_NAMES[name]?.en || name;
  }, [isRTL]);

  const formula = getConversionFormula();

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results) return "";

    const boxLines = results.results
      .map((r, i) => {
        const boxNum = results.results.length > 1 ? `${t("box")} ${i + 1}: ` : "";
        return `${boxNum}
  CM: ${formatDimensions(r.cm.length, r.cm.width, r.cm.height, "cm")} = ${formatVolume(r.cm.volume, "cm")}
  Inch: ${formatDimensions(r.inch.length, r.inch.width, r.inch.height, "in")} = ${formatVolume(r.inch.volume, "inch")}${
          r.recommendedBoxSize ? `\n  ${t("recommendedBox")}: ${getBoxSizeName(r.recommendedBoxSize)}` : ""
        }`;
      })
      .join("\n\n");

    const totalLine = results.results.length > 1
      ? `\n━━━━━━━━━━━━━━━━━━\n${t("totalVolume")}:\n  CM: ${formatVolume(results.totalVolumeCm, "cm")}\n  Inch: ${formatVolume(results.totalVolumeInch, "inch")}`
      : "";

    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${boxLines}${totalLine}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, t, isRTL, getBoxSizeName]);

  // Export data
  const exportData = useMemo(() => {
    if (!results) return { inputs: {}, results: {} };

    const firstResult = results.results[0];
    
    return {
      inputs: {
        [t("inputUnit")]: unit === "cm" ? t("centimeters") : t("inches"),
        [t("numberOfBoxes")]: results.results.length.toString(),
      },
      results: {
        [`${t("dimensions")} (cm)`]: formatDimensions(firstResult.cm.length, firstResult.cm.width, firstResult.cm.height, "cm"),
        [`${t("dimensions")} (inch)`]: formatDimensions(firstResult.inch.length, firstResult.inch.width, firstResult.inch.height, "in"),
        [`${t("volume")} (cm³)`]: formatVolume(results.totalVolumeCm, "cm"),
        [`${t("volume")} (in³)`]: formatVolume(results.totalVolumeInch, "inch"),
      },
      comparisonTable: results.results.length > 1 ? {
        headers: [t("box"), `${t("dimensions")} (cm)`, `${t("volume")} (cm³)`, `${t("dimensions")} (inch)`, `${t("volume")} (in³)`],
        rows: results.results.map((r, i) => [
          `${t("box")} ${i + 1}`,
          formatDimensions(r.cm.length, r.cm.width, r.cm.height, ""),
          r.cm.volume.toString(),
          formatDimensions(r.inch.length, r.inch.width, r.inch.height, ""),
          r.inch.volume.toString(),
        ]),
      } : undefined,
      metadata: {
        toolName: t("title"),
        date: new Date().toLocaleDateString(locale),
        locale,
      },
    };
  }, [results, unit, t, locale]);

  // Result card data
  const resultCardInputs = useMemo(() => {
    if (!results || results.results.length === 0) return {};
    const firstResult = results.results[0];
    return {
      inputDimensions: {
        label: t("inputDimensions"),
        value: unit === "cm"
          ? formatDimensions(firstResult.cm.length, firstResult.cm.width, firstResult.cm.height, "cm")
          : formatDimensions(firstResult.inch.length, firstResult.inch.width, firstResult.inch.height, "in"),
      },
    };
  }, [results, unit, t]);

  const resultCardOutputs = useMemo(() => {
    if (!results || results.results.length === 0) return {};
    const firstResult = results.results[0];
    return {
      cmDimensions: { label: `${t("dimensions")} (cm)`, value: formatDimensions(firstResult.cm.length, firstResult.cm.width, firstResult.cm.height, "cm") },
      inchDimensions: { label: `${t("dimensions")} (inch)`, value: formatDimensions(firstResult.inch.length, firstResult.inch.width, firstResult.inch.height, "in") },
      volumeCm: { label: `${t("volume")} (cm³)`, value: formatVolume(results.totalVolumeCm, "cm"), highlight: true },
    };
  }, [results, t]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Unit Selection */}
          <div className="space-y-2">
            <Label>{t("inputUnit")}</Label>
            <div className="flex gap-2">
              {(["cm", "inch"] as DimensionUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                    unit === u
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50"
                  }`}
                  aria-pressed={unit === u}
                >
                  {u === "cm" ? t("centimeters") : t("inches")}
                </button>
              ))}
            </div>
          </div>

          {/* Box Inputs - Requirement 3.5 for batch */}
          {boxes.map((box, index) => (
            <div key={box.id} className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <Label>{isBatchMode ? `${t("box")} ${index + 1}` : t("dimensions")}</Label>
                {boxes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBox(box.id)}
                    className="h-8 w-8 p-0 text-destructive"
                    aria-label={t("removeBox")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder={t("length")}
                    value={box.length}
                    onChange={(e) => updateBox(box.id, "length", e.target.value)}
                    aria-label={`${t("length")} ${isBatchMode ? index + 1 : ""}`}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder={t("width")}
                    value={box.width}
                    onChange={(e) => updateBox(box.id, "width", e.target.value)}
                    aria-label={`${t("width")} ${isBatchMode ? index + 1 : ""}`}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder={t("height")}
                    value={box.height}
                    onChange={(e) => updateBox(box.id, "height", e.target.value)}
                    aria-label={`${t("height")} ${isBatchMode ? index + 1 : ""}`}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add Box Button */}
          <Button
            variant="outline"
            onClick={addBox}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("addBox")}
          </Button>

          {/* Formula Info */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm">
            <ArrowLeftRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">{t("conversionFormula")}</p>
              <p className="text-muted-foreground">{formula.cmToInch}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {hasValidInputs && results && (
        <>
          {/* Conversion Results */}
          {results.results.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4 text-primary" aria-hidden="true" />
                  {isBatchMode ? `${t("box")} ${index + 1}` : t("conversionResults")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CM Results */}
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">{t("centimeters")}</h4>
                    <p className="text-lg font-bold">
                      {formatDimensions(result.cm.length, result.cm.width, result.cm.height, "cm")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("volume")}: {formatVolume(result.cm.volume, "cm")}
                    </p>
                  </div>

                  {/* Inch Results */}
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">{t("inches")}</h4>
                    <p className="text-lg font-bold">
                      {formatDimensions(result.inch.length, result.inch.width, result.inch.height, "in")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("volume")}: {formatVolume(result.inch.volume, "inch")}
                    </p>
                  </div>
                </div>

                {/* Recommended Box Size - Requirement 3.4 */}
                {result.recommendedBoxSize && (
                  <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary">
                    <p className="text-sm">
                      <span className="font-medium">{t("recommendedBox")}: </span>
                      {getBoxSizeName(result.recommendedBoxSize)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Total Volume (for batch) */}
          {isBatchMode && results.results.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("totalVolume")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-primary/10 border-2 border-primary">
                    <dt className="text-sm text-muted-foreground mb-1">{t("totalVolumeCm")}</dt>
                    <dd className="text-xl font-bold text-primary">{formatVolume(results.totalVolumeCm, "cm")}</dd>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <dt className="text-sm text-muted-foreground mb-1">{t("totalVolumeInch")}</dt>
                    <dd className="text-xl font-bold">{formatVolume(results.totalVolumeInch, "inch")}</dd>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Common Box Sizes Reference */}
          <Card>
            <CardHeader>
              <CardTitle>{t("commonBoxSizes")}</CardTitle>
              <CardDescription>{t("commonBoxSizesDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start p-3 font-medium">{t("boxType")}</th>
                      <th className="text-center p-3 font-medium">{t("dimensionsCm")}</th>
                      <th className="text-center p-3 font-medium">{t("dimensionsInch")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMMON_BOX_SIZES.map((box) => (
                      <tr key={box.name} className="border-b">
                        <td className="p-3 font-medium">{getBoxSizeName(box.name)}</td>
                        <td className="p-3 text-center">{`${box.cm.l} × ${box.cm.w} × ${box.cm.h}`}</td>
                        <td className="p-3 text-center">{`${box.inch.l} × ${box.inch.w} × ${box.inch.h}`}</td>
                      </tr>
                    ))}
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

          {/* Share and Export Buttons - Requirements 3.8-3.11 */}
          <ShareButtons
            copyText={copyText}
          />
          
          <ExportButtons
            data={exportData}
            filename="dimension-conversion"
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

      {/* SEO Content - Requirements 3.6, 3.7 */}
      <SEOContent toolSlug="dimensionConverter" />
    </div>
  );
}
