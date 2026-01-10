"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Package, Clock, DollarSign, Star } from "lucide-react";
import {
  calculateShipping,
  formatWeight,
  formatCurrency,
  CARRIER_NAMES,
  REGIONS,
  REGION_NAMES,
  type ShippingCarrier,
  type Region,
} from "@/lib/calculators/shipping";
import { SEOContent, ResultCard, ShareButtons } from "@/components/tools/shared";

/**
 * Shipping Carrier Cost Comparator Component
 * Compares shipping costs between carriers with volumetric weight calculation
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.9, 7.10
 */
export function ShippingComparator() {
  const t = useTranslations("tools.shippingComparator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states - Requirements 7.1, 7.2, 7.3, 7.4
  const [weight, setWeight] = useState<string>("");
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [originRegion, setOriginRegion] = useState<Region>("riyadh");
  const [destinationRegion, setDestinationRegion] = useState<Region>("jeddah");

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

  // Calculate results in real-time
  const results = useMemo(() => {
    if (
      parsedWeight === undefined ||
      parsedLength === undefined ||
      parsedWidth === undefined ||
      parsedHeight === undefined
    ) {
      return null;
    }
    return calculateShipping({
      weight: parsedWeight,
      length: parsedLength,
      width: parsedWidth,
      height: parsedHeight,
      originRegion,
      destinationRegion,
    });
  }, [parsedWeight, parsedLength, parsedWidth, parsedHeight, originRegion, destinationRegion]);

  const hasValidInputs = results !== null;
  const showResults = hasValidInputs && results;
  const hasAnyInput = weight !== "" || length !== "" || width !== "" || height !== "";

  // Get carrier name based on locale
  const getCarrierName = useCallback((carrier: ShippingCarrier) => {
    return isRTL ? CARRIER_NAMES[carrier].ar : CARRIER_NAMES[carrier].en;
  }, [isRTL]);

  // Get region name based on locale
  const getRegionName = useCallback((region: Region) => {
    return isRTL ? REGION_NAMES[region].ar : REGION_NAMES[region].en;
  }, [isRTL]);

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results) return "";

    const carrierLines = results.carriers
      .map((c) => {
        const badges = [];
        if (c.isCheapest) badges.push(isRTL ? "💰 الأرخص" : "💰 Cheapest");
        if (c.isFastest) badges.push(isRTL ? "⚡ الأسرع" : "⚡ Fastest");
        const badgeStr = badges.length > 0 ? ` (${badges.join(", ")})` : "";
        return `${getCarrierName(c.carrier)}: ${formatCurrency(c.cost)} - ${c.deliveryDays} ${isRTL ? "أيام" : "days"}${badgeStr}`;
      })
      .join("\n");

    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("weight")}: ${formatWeight(parsedWeight || 0)}
${t("dimensions")}: ${parsedLength} × ${parsedWidth} × ${parsedHeight} cm
${t("originRegion")}: ${getRegionName(originRegion)}
${t("destinationRegion")}: ${getRegionName(destinationRegion)}
━━━━━━━━━━━━━━━━━━
${t("volumetricWeight")}: ${formatWeight(results.volumetricWeight)}
${t("chargeableWeight")}: ${formatWeight(results.chargeableWeight)}
━━━━━━━━━━━━━━━━━━
${carrierLines}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedWeight, parsedLength, parsedWidth, parsedHeight, originRegion, destinationRegion, t, isRTL, getCarrierName, getRegionName]);

  // Result card data for sharing
  const resultCardInputs = useMemo(() => {
    return {
      weight: { label: t("weight"), value: formatWeight(parsedWeight || 0) },
      dimensions: {
        label: t("dimensions"),
        value: `${parsedLength || 0} × ${parsedWidth || 0} × ${parsedHeight || 0} cm`,
      },
      origin: { label: t("originRegion"), value: getRegionName(originRegion) },
      destination: { label: t("destinationRegion"), value: getRegionName(destinationRegion) },
    };
  }, [parsedWeight, parsedLength, parsedWidth, parsedHeight, originRegion, destinationRegion, t, getRegionName]);

  const resultCardOutputs = useMemo((): Record<
    string,
    { label: string; value: string; highlight?: boolean }
  > => {
    if (!results) return {};

    const cheapest = results.carriers.find((c) => c.isCheapest);
    const fastest = results.carriers.find((c) => c.isFastest);

    return {
      volumetricWeight: {
        label: t("volumetricWeight"),
        value: formatWeight(results.volumetricWeight),
      },
      chargeableWeight: {
        label: t("chargeableWeight"),
        value: formatWeight(results.chargeableWeight),
      },
      cheapestCarrier: {
        label: t("cheapestOption"),
        value: cheapest ? `${getCarrierName(cheapest.carrier)} - ${formatCurrency(cheapest.cost)}` : "-",
        highlight: true,
      },
      fastestCarrier: {
        label: t("fastestOption"),
        value: fastest ? `${getCarrierName(fastest.carrier)} - ${fastest.deliveryDays} ${isRTL ? "أيام" : "days"}` : "-",
      },
    };
  }, [results, t, isRTL, getCarrierName]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weight Input - Requirement 7.1 */}
          <div className="space-y-2">
            <Label htmlFor="weight">{t("weight")} (kg)</Label>
            <Input
              id="weight"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={weight}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeight(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Dimensions Input - Requirement 7.2 */}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLength(e.target.value)}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWidth(e.target.value)}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeight(e.target.value)}
                  aria-label={t("height")}
                />
              </div>
            </div>
          </div>

          {/* Origin Region Selection - Requirement 7.3 */}
          <div className="space-y-2">
            <Label>{t("originRegion")}</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {REGIONS.map((region) => {
                const isSelected = originRegion === region;
                return (
                  <button
                    key={`origin-${region}`}
                    type={"button" as const}
                    onClick={() => setOriginRegion(region)}
                    className={`p-2 rounded-lg border-2 transition-colors text-xs sm:text-sm font-medium ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted hover:border-primary/50"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {getRegionName(region)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destination Region Selection - Requirement 7.4 */}
          <div className="space-y-2">
            <Label>{t("destinationRegion")}</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {REGIONS.map((region) => {
                const isSelected = destinationRegion === region;
                return (
                  <button
                    key={`dest-${region}`}
                    type={"button" as const}
                    onClick={() => setDestinationRegion(region)}
                    className={`p-2 rounded-lg border-2 transition-colors text-xs sm:text-sm font-medium ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted hover:border-primary/50"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {getRegionName(region)}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && results && (
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
                  <dd className="text-xl font-bold">{formatWeight(parsedWeight || 0)}</dd>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("volumetricWeight")}</dt>
                  <dd className="text-xl font-bold text-blue-500">
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
            </CardContent>
          </Card>

          {/* Carrier Comparison Table - Requirements 7.7, 7.8, 7.9, 7.10 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" aria-hidden="true" />
                {t("carrierComparison")}
              </CardTitle>
              <CardDescription>{t("carrierComparisonDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start p-3 font-medium">{t("carrier")}</th>
                      <th className="text-end p-3 font-medium">{t("cost")}</th>
                      <th className="text-center p-3 font-medium">{t("deliveryTime")}</th>
                      <th className="text-center p-3 font-medium">{t("badges")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.carriers.map((carrier) => (
                      <tr
                        key={carrier.carrier}
                        className={`border-b ${
                          carrier.isCheapest
                            ? "bg-green-50 dark:bg-green-950/20"
                            : carrier.isFastest
                            ? "bg-blue-50 dark:bg-blue-950/20"
                            : ""
                        }`}
                      >
                        <td className="p-3 font-medium">{getCarrierName(carrier.carrier)}</td>
                        <td
                          className={`p-3 text-end font-bold ${
                            carrier.isCheapest ? "text-green-600 dark:text-green-400" : ""
                          }`}
                        >
                          {formatCurrency(carrier.cost)}
                        </td>
                        <td className="p-3 text-center">
                          <span className="flex items-center justify-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {carrier.deliveryDays} {isRTL ? "أيام" : "days"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {carrier.isCheapest && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <Star className="h-3 w-3" />
                                {t("cheapest")}
                              </span>
                            )}
                            {carrier.isFastest && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                <Clock className="h-3 w-3" />
                                {t("fastest")}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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
          {t("enterValidInputs")}
        </p>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="shippingComparator" />
    </div>
  );
}
