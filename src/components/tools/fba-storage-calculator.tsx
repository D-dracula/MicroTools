"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  calculateFBAStorage,
  formatNumber,
  formatCurrency,
  type SizeTier,
} from "@/lib/calculators/fba-storage";
import { SEOContent, ResultCard, ShareButtons } from "@/components/tools/shared";

/**
 * Amazon FBA Storage Fee Calculator Component
 * Calculates long-term storage fees including surcharges
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
export function FBAStorageCalculator() {
  const t = useTranslations("tools.fbaStorageCalculator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states - Requirements 9.1, 9.2, 9.3, 9.4
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [units, setUnits] = useState<string>("");
  const [storageDuration, setStorageDuration] = useState<string>("");
  const [sizeTier, setSizeTier] = useState<SizeTier>("standard");

  // Parse input values to numbers
  const parsedInputs = useMemo(() => ({
    length: parseFloat(length) || undefined,
    width: parseFloat(width) || undefined,
    height: parseFloat(height) || undefined,
    units: parseInt(units) || undefined,
    storageDuration: parseInt(storageDuration) || undefined,
  }), [length, width, height, units, storageDuration]);

  // Calculate results in real-time
  const results = useMemo(() => {
    const { length: l, width: w, height: h, units: u, storageDuration: sd } = parsedInputs;
    if (l === undefined || w === undefined || h === undefined || 
        u === undefined || sd === undefined) {
      return null;
    }
    return calculateFBAStorage({
      length: l,
      width: w,
      height: h,
      units: u,
      storageDuration: sd,
      sizeTier,
    });
  }, [parsedInputs, sizeTier]);


  const hasValidInputs = results !== null;
  const showResults = hasValidInputs && results;
  const hasAnyInput = length !== "" || width !== "" || height !== "" || 
                      units !== "" || storageDuration !== "";

  // Check for warnings
  const hasAgedSurcharge = results && results.agedInventorySurcharge > 0;
  const hasLongTermFee = results && results.longTermStorageFee > 0;

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results) return "";
    const tierLabel = sizeTier === "standard" ? t("standard") : t("oversize");
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("dimensions")}: ${length}" × ${width}" × ${height}"
${t("units")}: ${units}
${t("storageDuration")}: ${storageDuration} ${t("months")}
${t("sizeTier")}: ${tierLabel}
━━━━━━━━━━━━━━━━━━
${t("cubicFeet")}: ${formatNumber(results.cubicFeet)} ft³
${t("monthlyFee")}: ${formatCurrency(results.monthlyFee)}
${hasAgedSurcharge ? `${t("agedSurcharge")}: ${formatCurrency(results.agedInventorySurcharge)}\n` : ""}${hasLongTermFee ? `${t("longTermFee")}: ${formatCurrency(results.longTermStorageFee)}\n` : ""}${t("totalCost")}: ${formatCurrency(results.totalCost)}
${t("costPerUnit")}: ${formatCurrency(results.costPerUnit)}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, length, width, height, units, storageDuration, sizeTier, t, isRTL, hasAgedSurcharge, hasLongTermFee]);

  // Result card data for sharing
  const resultCardInputs = useMemo(() => ({
    dimensions: { label: t("dimensions"), value: `${length}" × ${width}" × ${height}"` },
    units: { label: t("units"), value: units },
    duration: { label: t("storageDuration"), value: `${storageDuration} ${t("months")}` },
    sizeTier: { label: t("sizeTier"), value: sizeTier === "standard" ? t("standard") : t("oversize") },
  }), [length, width, height, units, storageDuration, sizeTier, t]);

  const resultCardOutputs = useMemo(() => {
    if (!results) return {};
    return {
      cubicFeet: { label: t("cubicFeet"), value: `${formatNumber(results.cubicFeet)} ft³` },
      monthlyFee: { label: t("monthlyFee"), value: formatCurrency(results.monthlyFee) },
      ...(hasAgedSurcharge ? { agedSurcharge: { label: t("agedSurcharge"), value: formatCurrency(results.agedInventorySurcharge) } } : {}),
      ...(hasLongTermFee ? { longTermFee: { label: t("longTermFee"), value: formatCurrency(results.longTermStorageFee) } } : {}),
      totalCost: { label: t("totalCost"), value: formatCurrency(results.totalCost), highlight: true },
      costPerUnit: { label: t("costPerUnit"), value: formatCurrency(results.costPerUnit) },
    };
  }, [results, t, hasAgedSurcharge, hasLongTermFee]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Size Tier Toggle - Requirement 9.4 */}
          <div className="space-y-2">
            <Label>{t("sizeTier")}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sizeTier === "standard" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSizeTier("standard")}
                aria-pressed={sizeTier === "standard"}
              >
                {t("standard")}
              </Button>
              <Button
                type="button"
                variant={sizeTier === "oversize" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSizeTier("oversize")}
                aria-pressed={sizeTier === "oversize"}
              >
                {t("oversize")}
              </Button>
            </div>
          </div>

          {/* Dimensions Input - Requirement 9.1 */}
          <div className="space-y-2">
            <Label>{t("dimensions")} ({t("inches")})</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Input
                  id="length"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder={t("length")}
                  value={length}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLength(e.target.value)}
                  aria-label={t("length")}
                />
              </div>
              <div>
                <Input
                  id="width"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder={t("width")}
                  value={width}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWidth(e.target.value)}
                  aria-label={t("width")}
                />
              </div>
              <div>
                <Input
                  id="height"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder={t("height")}
                  value={height}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeight(e.target.value)}
                  aria-label={t("height")}
                />
              </div>
            </div>
          </div>


          {/* Units Input - Requirement 9.2 */}
          <div className="space-y-2">
            <Label htmlFor="units">{t("units")}</Label>
            <Input
              id="units"
              type="number"
              min="1"
              step="1"
              placeholder="100"
              value={units}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnits(e.target.value)}
            />
          </div>

          {/* Storage Duration Input - Requirement 9.3 */}
          <div className="space-y-2">
            <Label htmlFor="storageDuration">{t("storageDuration")} ({t("months")})</Label>
            <Input
              id="storageDuration"
              type="number"
              min="1"
              step="1"
              placeholder="6"
              value={storageDuration}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStorageDuration(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

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
              {/* Main Results Grid */}
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Cubic Feet */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("cubicFeet")}</dt>
                  <dd className="text-xl font-bold">
                    {formatNumber(results.cubicFeet)} <span className="text-sm">ft³</span>
                  </dd>
                </div>

                {/* Average Monthly Fee */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("avgMonthlyFee")}</dt>
                  <dd className="text-xl font-bold">
                    {formatCurrency(results.monthlyFee)}
                  </dd>
                </div>

                {/* Total Cost */}
                <div className="text-center p-4 rounded-lg bg-muted col-span-2 sm:col-span-1">
                  <dt className="text-sm text-muted-foreground mb-1">{t("totalCost")}</dt>
                  <dd className="text-xl font-bold text-green-500">
                    {formatCurrency(results.totalCost)}
                  </dd>
                </div>
              </dl>

              {/* Cost Per Unit */}
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
                <dt className="text-sm text-muted-foreground mb-1">{t("costPerUnit")}</dt>
                <dd className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(results.costPerUnit)}
                </dd>
              </div>

              {/* Surcharge Warnings */}
              {(hasAgedSurcharge || hasLongTermFee) && (
                <div className="space-y-2">
                  {hasAgedSurcharge && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-medium">{t("agedSurchargeWarning")}</p>
                        <p className="text-sm">{t("agedSurcharge")}: {formatCurrency(results.agedInventorySurcharge)}</p>
                      </div>
                    </div>
                  )}
                  {hasLongTermFee && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-medium">{t("longTermFeeWarning")}</p>
                        <p className="text-sm">{t("longTermFee")}: {formatCurrency(results.longTermStorageFee)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Monthly Breakdown Table */}
              <div className="space-y-2">
                <h4 className="font-medium">{t("monthlyBreakdown")}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" role="table">
                    <thead>
                      <tr className="border-b">
                        <th className="text-start p-2">{t("month")}</th>
                        <th className="text-end p-2">{t("storageFee")}</th>
                        <th className="text-end p-2">{t("surcharge")}</th>
                        <th className="text-end p-2">{t("total")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.monthlyBreakdown.map((month) => (
                        <tr 
                          key={month.month} 
                          className={`border-b ${month.surcharge > 0 ? 'bg-yellow-50 dark:bg-yellow-950/30' : ''}`}
                        >
                          <td className="p-2">{month.month}</td>
                          <td className="text-end p-2">{formatCurrency(month.fee)}</td>
                          <td className="text-end p-2">
                            {month.surcharge > 0 ? formatCurrency(month.surcharge) : '-'}
                          </td>
                          <td className="text-end p-2 font-medium">{formatCurrency(month.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold bg-muted">
                        <td className="p-2">{t("total")}</td>
                        <td className="text-end p-2">
                          {formatCurrency(results.monthlyBreakdown.reduce((sum, m) => sum + m.fee, 0))}
                        </td>
                        <td className="text-end p-2">
                          {formatCurrency(results.monthlyBreakdown.reduce((sum, m) => sum + m.surcharge, 0))}
                        </td>
                        <td className="text-end p-2 text-green-600 dark:text-green-400">
                          {formatCurrency(results.totalCost)}
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
      {!hasValidInputs && hasAnyInput && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterValidNumbers")}
        </p>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="fbaStorageCalculator" />
    </div>
  );
}
