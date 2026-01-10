"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, MapPin, Truck, AlertTriangle, Calendar, Package } from "lucide-react";
import {
  calculateLeadTime,
  getLocationName,
  getMethodName,
  formatDate,
  getTransitTimeRange,
  isCurrentlyPeakSeason,
  LOCATION_NAMES,
  METHOD_NAMES,
  type SupplierLocation,
  type ShippingMethod,
} from "@/lib/calculators/lead-time";
import { SEOContent, ResultCard, ShareButtons, ExportButtons } from "@/components/tools/shared";

/**
 * Lead Time Tracker Component
 * Calculates shipping lead times with timeline breakdown
 * Requirements: 6.1-6.11
 */
export function LeadTimeTracker() {
  const t = useTranslations("tools.leadTimeTracker");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states
  const [supplierLocation, setSupplierLocation] = useState<SupplierLocation>("china");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("sea");
  const [processingDays, setProcessingDays] = useState<string>("7");
  const [includeCustoms, setIncludeCustoms] = useState<boolean>(true);
  const [isPeakSeason, setIsPeakSeason] = useState<boolean>(isCurrentlyPeakSeason());

  // Parse input values
  const parsedProcessingDays = useMemo(() => {
    const val = parseInt(processingDays);
    return isNaN(val) || val < 0 ? undefined : val;
  }, [processingDays]);

  // Check if rail is available for selected location
  const isRailAvailable = supplierLocation !== 'usa';

  // Calculate results
  const results = useMemo(() => {
    if (parsedProcessingDays === undefined) {
      return null;
    }
    return calculateLeadTime({
      supplierLocation,
      shippingMethod,
      supplierProcessingDays: parsedProcessingDays,
      includeCustoms,
      isPeakSeason,
    }, locale);
  }, [supplierLocation, shippingMethod, parsedProcessingDays, includeCustoms, isPeakSeason, locale]);

  const hasValidInputs = results !== null;

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results) return "";

    const breakdown = results.breakdown;
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("supplierLocation")}: ${getLocationName(supplierLocation, locale)}
${t("shippingMethod")}: ${getMethodName(shippingMethod, locale)}
${t("supplierProcessingDays")}: ${parsedProcessingDays} ${isRTL ? "يوم" : "days"}
━━━━━━━━━━━━━━━━━━
${t("timeline")}:
• ${t("supplierProcessing")}: ${breakdown.supplierProcessing} ${isRTL ? "يوم" : "days"}
• ${t("shippingTransit")}: ${breakdown.shippingTransit} ${isRTL ? "يوم" : "days"}
• ${t("customsClearance")}: ${breakdown.customsClearance} ${isRTL ? "يوم" : "days"}
${breakdown.peakSeasonBuffer > 0 ? `• ${t("peakSeasonBuffer")}: ${breakdown.peakSeasonBuffer} ${isRTL ? "يوم" : "days"}` : ""}
━━━━━━━━━━━━━━━━━━
${t("totalDays")}: ${breakdown.totalDays} ${isRTL ? "يوم" : "days"}
${t("estimatedArrival")}: ${formatDate(results.estimatedArrival, locale)}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, supplierLocation, shippingMethod, parsedProcessingDays, t, locale, isRTL]);

  // Export data
  const exportData = useMemo(() => {
    if (!results) return { inputs: {}, results: {} };

    return {
      inputs: {
        [t("supplierLocation")]: getLocationName(supplierLocation, locale),
        [t("shippingMethod")]: getMethodName(shippingMethod, locale),
        [t("supplierProcessingDays")]: `${parsedProcessingDays} ${isRTL ? "يوم" : "days"}`,
        [t("includeCustoms")]: includeCustoms ? (isRTL ? "نعم" : "Yes") : (isRTL ? "لا" : "No"),
        [t("peakSeason")]: isPeakSeason ? (isRTL ? "نعم" : "Yes") : (isRTL ? "لا" : "No"),
      },
      results: {
        [t("supplierProcessing")]: `${results.breakdown.supplierProcessing} ${isRTL ? "يوم" : "days"}`,
        [t("shippingTransit")]: `${results.breakdown.shippingTransit} ${isRTL ? "يوم" : "days"}`,
        [t("customsClearance")]: `${results.breakdown.customsClearance} ${isRTL ? "يوم" : "days"}`,
        [t("peakSeasonBuffer")]: `${results.breakdown.peakSeasonBuffer} ${isRTL ? "يوم" : "days"}`,
        [t("totalDays")]: `${results.breakdown.totalDays} ${isRTL ? "يوم" : "days"}`,
        [t("estimatedArrival")]: formatDate(results.estimatedArrival, locale),
      },
      metadata: {
        toolName: t("title"),
        date: new Date().toLocaleDateString(locale),
        locale,
      },
    };
  }, [results, supplierLocation, shippingMethod, parsedProcessingDays, includeCustoms, isPeakSeason, t, locale, isRTL]);

  // Result card data
  const resultCardInputs = useMemo(() => ({
    location: { label: t("supplierLocation"), value: getLocationName(supplierLocation, locale) },
    method: { label: t("shippingMethod"), value: getMethodName(shippingMethod, locale) },
    processing: { label: t("supplierProcessingDays"), value: `${parsedProcessingDays || 0} ${isRTL ? "يوم" : "days"}` },
  }), [supplierLocation, shippingMethod, parsedProcessingDays, t, locale, isRTL]);

  const resultCardOutputs = useMemo(() => {
    if (!results) return {};
    return {
      totalDays: { label: t("totalDays"), value: `${results.breakdown.totalDays} ${isRTL ? "يوم" : "days"}`, highlight: true },
      arrival: { label: t("estimatedArrival"), value: formatDate(results.estimatedArrival, locale) },
    };
  }, [results, t, locale, isRTL]);

  // Timeline visualization data
  const timelineSteps = useMemo(() => {
    if (!results) return [];
    const { breakdown } = results;
    const steps = [
      { label: t("supplierProcessing"), days: breakdown.supplierProcessing, icon: Package, color: "bg-blue-500" },
      { label: t("shippingTransit"), days: breakdown.shippingTransit, icon: Truck, color: "bg-green-500" },
    ];
    if (breakdown.customsClearance > 0) {
      steps.push({ label: t("customsClearance"), days: breakdown.customsClearance, icon: MapPin, color: "bg-orange-500" });
    }
    if (breakdown.peakSeasonBuffer > 0) {
      steps.push({ label: t("peakSeasonBuffer"), days: breakdown.peakSeasonBuffer, icon: AlertTriangle, color: "bg-red-500" });
    }
    return steps;
  }, [results, t]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Supplier Location Selection */}
          <div className="space-y-2">
            <Label>{t("supplierLocation")}</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(LOCATION_NAMES) as SupplierLocation[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    setSupplierLocation(loc);
                    // Reset to sea if rail selected and not available
                    if (loc === 'usa' && shippingMethod === 'rail') {
                      setShippingMethod('sea');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                    supplierLocation === loc
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50"
                  }`}
                  aria-pressed={supplierLocation === loc}
                >
                  {getLocationName(loc, locale)}
                </button>
              ))}
            </div>
          </div>

          {/* Shipping Method Selection */}
          <div className="space-y-2">
            <Label>{t("shippingMethod")}</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(METHOD_NAMES) as ShippingMethod[]).map((method) => {
                const isDisabled = method === 'rail' && !isRailAvailable;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => !isDisabled && setShippingMethod(method)}
                    disabled={isDisabled}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                      shippingMethod === method
                        ? "border-primary bg-primary/10 text-primary"
                        : isDisabled
                        ? "border-muted text-muted-foreground opacity-50 cursor-not-allowed"
                        : "border-muted hover:border-primary/50"
                    }`}
                    aria-pressed={shippingMethod === method}
                    aria-disabled={isDisabled}
                  >
                    {getMethodName(method, locale)}
                    {isDisabled && <span className="text-xs ml-1">({isRTL ? "غير متاح" : "N/A"})</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("transitTimeRange")}: {getTransitTimeRange(supplierLocation, shippingMethod, locale)}
            </p>
          </div>

          {/* Supplier Processing Days */}
          <div className="space-y-2">
            <Label htmlFor="processingDays">{t("supplierProcessingDays")}</Label>
            <Input
              id="processingDays"
              type="number"
              min="0"
              step="1"
              placeholder="7"
              value={processingDays}
              onChange={(e) => setProcessingDays(e.target.value)}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">{t("processingDaysHint")}</p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeCustoms">{t("includeCustoms")}</Label>
                <p className="text-xs text-muted-foreground">{t("includeCustomsHint")}</p>
              </div>
              <Switch
                id="includeCustoms"
                checked={includeCustoms}
                onCheckedChange={setIncludeCustoms}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="peakSeason">{t("peakSeason")}</Label>
                <p className="text-xs text-muted-foreground">{t("peakSeasonHint")}</p>
              </div>
              <Switch
                id="peakSeason"
                checked={isPeakSeason}
                onCheckedChange={setIsPeakSeason}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {hasValidInputs && results && (
        <>
          {/* Timeline Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                {t("timeline")}
              </CardTitle>
              <CardDescription>{t("timelineDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Timeline Steps */}
              <div className="space-y-4">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  const percentage = (step.days / results.breakdown.totalDays) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full ${step.color} text-white`}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <span className="text-sm font-medium">{step.label}</span>
                        </div>
                        <span className="text-sm font-bold">{step.days} {isRTL ? "يوم" : "days"}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${step.color} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Summary */}
              <div className="mt-6 p-4 rounded-lg bg-primary/10 border-2 border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("totalDays")}</p>
                    <p className="text-2xl font-bold text-primary">
                      {results.breakdown.totalDays} {isRTL ? "يوم" : "days"}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm text-muted-foreground">{t("estimatedArrival")}</p>
                    <p className="text-lg font-semibold">
                      {formatDate(results.estimatedArrival, locale)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Table */}
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
                      <th className="text-start p-3 font-medium">{t("stage")}</th>
                      <th className="text-end p-3 font-medium">{t("days")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">{t("supplierProcessing")}</td>
                      <td className="p-3 text-end font-medium">{results.breakdown.supplierProcessing}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">{t("shippingTransit")}</td>
                      <td className="p-3 text-end font-medium">{results.breakdown.shippingTransit}</td>
                    </tr>
                    {results.breakdown.customsClearance > 0 && (
                      <tr className="border-b">
                        <td className="p-3">{t("customsClearance")}</td>
                        <td className="p-3 text-end font-medium">{results.breakdown.customsClearance}</td>
                      </tr>
                    )}
                    {results.breakdown.peakSeasonBuffer > 0 && (
                      <tr className="border-b bg-orange-50 dark:bg-orange-950/10">
                        <td className="p-3 text-orange-700 dark:text-orange-400">{t("peakSeasonBuffer")}</td>
                        <td className="p-3 text-end font-medium text-orange-700 dark:text-orange-400">
                          +{results.breakdown.peakSeasonBuffer}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-primary/5">
                      <td className="p-3 font-bold">{t("totalDays")}</td>
                      <td className="p-3 text-end font-bold text-primary">{results.breakdown.totalDays}</td>
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
                  className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"
                >
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <p className="text-sm text-orange-700 dark:text-orange-400">{warning}</p>
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
            filename="lead-time"
            title={t("title")}
            copyText={copyText}
          />
        </>
      )}

      {/* Validation Message */}
      {!hasValidInputs && processingDays !== "" && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterValidInputs")}
        </p>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="leadTimeTracker" />
    </div>
  );
}
