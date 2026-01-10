"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Container, Package, Plus, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import {
  calculateCBM,
  getContainerName,
  formatCBM,
  createDefaultCarton,
  CONTAINER_SPECS,
  ALL_CONTAINER_TYPES,
  type ContainerType,
  type CartonDimensions,
} from "@/lib/calculators/cbm-calculation";
import { SEOContent, ResultCard, ShareButtons, ExportButtons } from "@/components/tools/shared";

/**
 * CBM Calculator Component
 * Calculates container utilization and CBM for shipping
 * Requirements: 7.1-7.11
 */
export function CBMCalculator() {
  const t = useTranslations("tools.cbmCalculator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states
  const [containerType, setContainerType] = useState<ContainerType>("40ft");
  const [unitSystem, setUnitSystem] = useState<'cm' | 'inch'>('cm');
  const [cartons, setCartons] = useState<CartonDimensions[]>([createDefaultCarton()]);

  // Update carton
  const updateCarton = useCallback((id: string, field: keyof CartonDimensions, value: string) => {
    setCartons(prev => prev.map(carton => {
      if (carton.id !== id) return carton;
      const numValue = parseFloat(value);
      return {
        ...carton,
        [field]: isNaN(numValue) ? 0 : numValue,
      };
    }));
  }, []);

  // Add carton
  const addCarton = useCallback(() => {
    setCartons(prev => [...prev, createDefaultCarton()]);
  }, []);

  // Remove carton
  const removeCarton = useCallback((id: string) => {
    setCartons(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(c => c.id !== id);
    });
  }, []);

  // Check if cartons have valid data
  const hasValidCartons = useMemo(() => {
    return cartons.some(c => 
      c.length > 0 && c.width > 0 && c.height > 0 && c.quantity > 0
    );
  }, [cartons]);

  // Filter valid cartons for calculation
  const validCartons = useMemo(() => {
    return cartons.filter(c => 
      c.length > 0 && c.width > 0 && c.height > 0 && c.quantity > 0
    );
  }, [cartons]);

  // Calculate results
  const results = useMemo(() => {
    if (!hasValidCartons) return null;
    return calculateCBM({
      containerType,
      cartons: validCartons,
      unitSystem,
    }, locale);
  }, [containerType, validCartons, unitSystem, hasValidCartons, locale]);

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results) return "";

    const cartonLines = results.cartonResults
      .map((c, i) => `${i + 1}. ${c.quantity}x → ${formatCBM(c.totalCBM, locale)}`)
      .join("\n");

    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("containerType")}: ${getContainerName(containerType, locale)}
${t("containerCapacity")}: ${results.containerCapacity} ${isRTL ? "م³" : "m³"}
━━━━━━━━━━━━━━━━━━
${t("cartons")}:
${cartonLines}
━━━━━━━━━━━━━━━━━━
${t("totalCBM")}: ${formatCBM(results.totalCBM, locale)}
${t("utilization")}: ${results.utilizationPercentage}%
${t("remainingCapacity")}: ${formatCBM(results.remainingCapacity, locale)}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, containerType, t, locale, isRTL]);

  // Export data
  const exportData = useMemo(() => {
    if (!results) return { inputs: {}, results: {} };

    return {
      inputs: {
        [t("containerType")]: getContainerName(containerType, locale),
        [t("unitSystem")]: unitSystem === 'cm' ? (isRTL ? 'سنتيمتر' : 'Centimeters') : (isRTL ? 'إنش' : 'Inches'),
      },
      results: {
        [t("totalCBM")]: formatCBM(results.totalCBM, locale),
        [t("containerCapacity")]: `${results.containerCapacity} ${isRTL ? "م³" : "m³"}`,
        [t("utilization")]: `${results.utilizationPercentage}%`,
        [t("remainingCapacity")]: formatCBM(results.remainingCapacity, locale),
      },
      comparisonTable: {
        headers: [t("cartonNumber"), t("quantity"), t("cbmPerCarton"), t("totalCBM")],
        rows: results.cartonResults.map((c, i) => [
          `${i + 1}`,
          `${c.quantity}`,
          formatCBM(c.cbmPerCarton, locale),
          formatCBM(c.totalCBM, locale),
        ]),
      },
      metadata: {
        toolName: t("title"),
        date: new Date().toLocaleDateString(locale),
        locale,
      },
    };
  }, [results, containerType, unitSystem, t, locale, isRTL]);

  // Result card data
  const resultCardInputs = useMemo(() => ({
    container: { label: t("containerType"), value: getContainerName(containerType, locale) },
    cartonCount: { label: t("cartonTypes"), value: `${validCartons.length}` },
  }), [containerType, validCartons.length, t, locale]);

  const resultCardOutputs = useMemo((): Record<string, { label: string; value: string; highlight?: boolean }> => {
    if (!results) return {};
    return {
      totalCBM: { label: t("totalCBM"), value: formatCBM(results.totalCBM, locale), highlight: true },
      utilization: { label: t("utilization"), value: `${results.utilizationPercentage}%` },
      remaining: { label: t("remainingCapacity"), value: formatCBM(results.remainingCapacity, locale) },
    };
  }, [results, t, locale]);

  // Get utilization color
  const getUtilizationColor = (percentage: number) => {
    if (percentage > 100) return "text-red-500";
    if (percentage > 90) return "text-orange-500";
    if (percentage > 70) return "text-green-500";
    return "text-blue-500";
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Container className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Container Type Selection */}
          <div className="space-y-2">
            <Label>{t("containerType")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_CONTAINER_TYPES.map((type) => {
                const spec = CONTAINER_SPECS[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setContainerType(type)}
                    className={`p-3 rounded-lg border-2 transition-colors text-center ${
                      containerType === type
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50"
                    }`}
                    aria-pressed={containerType === type}
                  >
                    <div className="text-sm font-medium">{type}</div>
                    <div className="text-xs text-muted-foreground">{spec.capacityCBM} {isRTL ? "م³" : "m³"}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit System Toggle */}
          <div className="space-y-2">
            <Label>{t("unitSystem")}</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUnitSystem('cm')}
                className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                  unitSystem === 'cm'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted hover:border-primary/50"
                }`}
                aria-pressed={unitSystem === 'cm'}
              >
                {isRTL ? "سنتيمتر (سم)" : "Centimeters (cm)"}
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem('inch')}
                className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                  unitSystem === 'inch'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted hover:border-primary/50"
                }`}
                aria-pressed={unitSystem === 'inch'}
              >
                {isRTL ? "إنش (بوصة)" : "Inches (in)"}
              </button>
            </div>
          </div>

          {/* Cartons Input */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t("cartons")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCarton}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                {t("addCarton")}
              </Button>
            </div>

            <div className="space-y-3">
              {cartons.map((carton, index) => (
                <div
                  key={carton.id}
                  className="p-4 rounded-lg border bg-muted/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {t("carton")} {index + 1}
                    </span>
                    {cartons.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCarton(carton.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">{t("length")}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="0"
                        value={carton.length || ""}
                        onChange={(e) => updateCarton(carton.id, 'length', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t("width")}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="0"
                        value={carton.width || ""}
                        onChange={(e) => updateCarton(carton.id, 'width', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t("height")}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="0"
                        value={carton.height || ""}
                        onChange={(e) => updateCarton(carton.id, 'height', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t("quantity")}</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1"
                        value={carton.quantity || ""}
                        onChange={(e) => updateCarton(carton.id, 'quantity', e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results && (
        <>
          {/* Utilization Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Container className="h-5 w-5 text-primary" aria-hidden="true" />
                {t("utilizationSummary")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Utilization Bar */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span>{t("utilization")}</span>
                  <span className={`font-bold ${getUtilizationColor(results.utilizationPercentage)}`}>
                    {results.utilizationPercentage}%
                  </span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      results.isOverCapacity ? "bg-red-500" : 
                      results.utilizationPercentage > 90 ? "bg-orange-500" :
                      results.utilizationPercentage > 70 ? "bg-green-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(results.utilizationPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Summary Grid */}
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <dt className="text-xs text-muted-foreground mb-1">{t("totalCBM")}</dt>
                  <dd className="text-lg font-bold">{formatCBM(results.totalCBM, locale)}</dd>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <dt className="text-xs text-muted-foreground mb-1">{t("containerCapacity")}</dt>
                  <dd className="text-lg font-bold">{results.containerCapacity} {isRTL ? "م³" : "m³"}</dd>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <dt className="text-xs text-muted-foreground mb-1">{t("remainingCapacity")}</dt>
                  <dd className={`text-lg font-bold ${results.isOverCapacity ? "text-red-500" : "text-green-500"}`}>
                    {results.isOverCapacity ? "-" : ""}{formatCBM(results.remainingCapacity, locale)}
                  </dd>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary/10 border-2 border-primary">
                  <dt className="text-xs text-muted-foreground mb-1">{t("status")}</dt>
                  <dd className="flex items-center justify-center gap-1">
                    {results.isOverCapacity ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-bold text-red-500">{t("overCapacity")}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-bold text-green-500">{t("withinCapacity")}</span>
                      </>
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Carton Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t("cartonBreakdown")}</CardTitle>
              <CardDescription>{t("cartonBreakdownDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start p-3 font-medium">{t("cartonNumber")}</th>
                      <th className="text-end p-3 font-medium">{t("quantity")}</th>
                      <th className="text-end p-3 font-medium">{t("cbmPerCarton")}</th>
                      <th className="text-end p-3 font-medium">{t("totalCBM")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.cartonResults.map((carton, index) => (
                      <tr key={carton.id} className="border-b">
                        <td className="p-3">{t("carton")} {index + 1}</td>
                        <td className="p-3 text-end">{carton.quantity}</td>
                        <td className="p-3 text-end text-muted-foreground">
                          {formatCBM(carton.cbmPerCarton, locale)}
                        </td>
                        <td className="p-3 text-end font-medium">
                          {formatCBM(carton.totalCBM, locale)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-primary/5">
                      <td className="p-3 font-bold" colSpan={3}>{t("total")}</td>
                      <td className="p-3 text-end font-bold text-primary">
                        {formatCBM(results.totalCBM, locale)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {results.warnings.length > 0 && (
            <div className="space-y-2">
              {results.warnings.map((warning, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-3 rounded-lg border ${
                    results.isOverCapacity
                      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                      : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                  }`}
                >
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                    results.isOverCapacity ? "text-red-500" : "text-orange-500"
                  }`} />
                  <p className={`text-sm ${
                    results.isOverCapacity 
                      ? "text-red-700 dark:text-red-400" 
                      : "text-orange-700 dark:text-orange-400"
                  }`}>{warning}</p>
                </div>
              ))}
            </div>
          )}

          {/* Shareable Result Card (hidden) */}
          <div className="sr-only">
            <ResultCard
              ref={resultCardRef}
              toolName={t("title")}
              inputs={resultCardInputs}
              outputs={resultCardOutputs}
            />
          </div>

          {/* Share and Export Buttons */}
          <ShareButtons
            copyText={copyText}
          />
          
          <ExportButtons
            data={exportData}
            filename="cbm-calculation"
            title={t("title")}
            copyText={copyText}
          />
        </>
      )}

      {/* Validation Message */}
      {!hasValidCartons && cartons.some(c => c.length > 0 || c.width > 0 || c.height > 0) && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterValidInputs")}
        </p>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="cbmCalculator" />
    </div>
  );
}
