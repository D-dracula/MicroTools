"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Package, 
  AlertTriangle, 
  Clock,
  TrendingDown,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import {
  calculateSafetyStock,
  validateSafetyStockInput,
  formatQuantity,
  formatDays,
  formatDate,
  type SafetyStockInput,
  type SafetyStockResult,
  type UrgencyLevel,
} from "@/lib/calculators/safety-stock-calculator";
import { SEOContent, ResultCard, ExportButtons, type ExportData } from "@/components/tools/shared";

/**
 * Safety Stock Calculator Component
 * Calculates safety stock levels and reorder points to prevent stockouts
 * Requirements: 3.4
 */
export function SafetyStockCalculator() {
  const t = useTranslations("tools.safetyStockCalculator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states
  const [averageDailySales, setAverageDailySales] = useState<string>("");
  const [leadTimeDays, setLeadTimeDays] = useState<string>("");
  const [safetyDays, setSafetyDays] = useState<string>("7");
  const [currentStock, setCurrentStock] = useState<string>("");

  // Parse input values
  const parsedInputs = useMemo((): Partial<SafetyStockInput> => ({
    averageDailySales: parseFloat(averageDailySales) || undefined,
    leadTimeDays: parseFloat(leadTimeDays) || undefined,
    safetyDays: parseFloat(safetyDays) || 7,
    currentStock: currentStock ? parseFloat(currentStock) : undefined,
  }), [averageDailySales, leadTimeDays, safetyDays, currentStock]);

  // Validate inputs
  const validation = useMemo(() => {
    return validateSafetyStockInput(parsedInputs);
  }, [parsedInputs]);

  // Calculate results
  const results: SafetyStockResult | null = useMemo(() => {
    if (!validation.isValid) return null;
    
    return calculateSafetyStock({
      averageDailySales: parsedInputs.averageDailySales!,
      leadTimeDays: parsedInputs.leadTimeDays!,
      safetyDays: parsedInputs.safetyDays || 7,
      currentStock: parsedInputs.currentStock,
    });
  }, [parsedInputs, validation.isValid]);

  const hasValidInputs = results !== null;
  const showResults = hasValidInputs && results;


  // Get urgency styling
  const getUrgencyStyles = (level: UrgencyLevel) => {
    switch (level) {
      case 'critical':
        return {
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive',
          textColor: 'text-destructive',
          icon: AlertTriangle,
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-600 dark:text-yellow-500',
          icon: AlertCircle,
        };
      default:
        return {
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500',
          textColor: 'text-green-600 dark:text-green-500',
          icon: CheckCircle,
        };
    }
  };

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results) return "";
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("averageDailySales")}: ${formatQuantity(parsedInputs.averageDailySales || 0)} ${t("units")}
${t("leadTimeDays")}: ${parsedInputs.leadTimeDays} ${t("days")}
${t("safetyDays")}: ${parsedInputs.safetyDays} ${t("days")}
${parsedInputs.currentStock !== undefined ? `${t("currentStock")}: ${formatQuantity(parsedInputs.currentStock)} ${t("units")}` : ""}
━━━━━━━━━━━━━━━━━━
${t("safetyStock")}: ${formatQuantity(results.safetyStock)} ${t("units")}
${t("reorderPoint")}: ${formatQuantity(results.reorderPoint)} ${t("units")}
${results.daysUntilStockout !== undefined ? `${t("daysUntilStockout")}: ${formatDays(results.daysUntilStockout)}` : ""}
${t("recommendedOrderQuantity")}: ${formatQuantity(results.recommendedOrderQuantity)} ${t("units")}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedInputs, t, isRTL]);

  // Export data for buttons
  const exportData: ExportData = useMemo(() => ({
    inputs: {
      [t("averageDailySales")]: `${formatQuantity(parsedInputs.averageDailySales || 0)} ${t("units")}`,
      [t("leadTimeDays")]: `${parsedInputs.leadTimeDays || 0} ${t("days")}`,
      [t("safetyDays")]: `${parsedInputs.safetyDays || 7} ${t("days")}`,
      ...(parsedInputs.currentStock !== undefined && {
        [t("currentStock")]: `${formatQuantity(parsedInputs.currentStock)} ${t("units")}`,
      }),
    },
    results: results ? {
      [t("safetyStock")]: `${formatQuantity(results.safetyStock)} ${t("units")}`,
      [t("reorderPoint")]: `${formatQuantity(results.reorderPoint)} ${t("units")}`,
      ...(results.daysUntilStockout !== undefined && {
        [t("daysUntilStockout")]: formatDays(results.daysUntilStockout),
      }),
      [t("recommendedOrderQuantity")]: `${formatQuantity(results.recommendedOrderQuantity)} ${t("units")}`,
      [t("urgencyLevel")]: t(`urgency.${results.urgencyLevel}`),
    } : {},
    metadata: {
      toolName: t("title"),
      date: new Date().toLocaleDateString(locale),
      locale,
    },
  }), [parsedInputs, results, t, locale]);

  // Result card data
  const resultCardInputs = useMemo(() => ({
    averageDailySales: { 
      label: t("averageDailySales"), 
      value: `${formatQuantity(parsedInputs.averageDailySales || 0)} ${t("units")}` 
    },
    leadTimeDays: { 
      label: t("leadTimeDays"), 
      value: `${parsedInputs.leadTimeDays || 0} ${t("days")}` 
    },
    safetyDays: { 
      label: t("safetyDays"), 
      value: `${parsedInputs.safetyDays || 7} ${t("days")}` 
    },
  }), [parsedInputs, t]);

  const resultCardOutputs = useMemo(() => {
    if (!results) return {};
    return {
      reorderPoint: { 
        label: t("reorderPoint"), 
        value: `${formatQuantity(results.reorderPoint)} ${t("units")}`, 
        highlight: true 
      },
      safetyStock: { 
        label: t("safetyStock"), 
        value: `${formatQuantity(results.safetyStock)} ${t("units")}` 
      },
    };
  }, [results, t]);


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
        <CardContent className="space-y-6">
          {/* Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Average Daily Sales Input */}
            <div className="space-y-2">
              <Label htmlFor="averageDailySales">{t("averageDailySales")}</Label>
              <Input
                id="averageDailySales"
                type="number"
                min="0"
                step="1"
                placeholder={t("averageDailySalesPlaceholder")}
                value={averageDailySales}
                onChange={(e) => setAverageDailySales(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("averageDailySalesHint")}</p>
            </div>

            {/* Lead Time Days Input */}
            <div className="space-y-2">
              <Label htmlFor="leadTimeDays">{t("leadTimeDays")}</Label>
              <Input
                id="leadTimeDays"
                type="number"
                min="1"
                step="1"
                placeholder={t("leadTimeDaysPlaceholder")}
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("leadTimeDaysHint")}</p>
            </div>

            {/* Safety Days Input */}
            <div className="space-y-2">
              <Label htmlFor="safetyDays">{t("safetyDays")}</Label>
              <Input
                id="safetyDays"
                type="number"
                min="0"
                step="1"
                placeholder="7"
                value={safetyDays}
                onChange={(e) => setSafetyDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("safetyDaysHint")}</p>
            </div>

            {/* Current Stock Input (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="currentStock">
                {t("currentStock")}
                <span className="text-xs text-muted-foreground ms-1">({t("optional")})</span>
              </Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                step="1"
                placeholder={t("currentStockPlaceholder")}
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("currentStockHint")}</p>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Results Section */}
      {showResults && results && (
        <>
          {/* Main Result Card */}
          <Card 
            className={getUrgencyStyles(results.urgencyLevel).borderColor}
            role="region"
            aria-label={isRTL ? "نتائج الحساب" : "Calculation results"}
            aria-live="polite"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const styles = getUrgencyStyles(results.urgencyLevel);
                  const Icon = styles.icon;
                  return (
                    <>
                      <Icon className={`h-5 w-5 ${styles.textColor}`} aria-hidden="true" />
                      <span className={styles.textColor}>
                        {t(`urgency.${results.urgencyLevel}`)}
                      </span>
                    </>
                  );
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Reorder Point */}
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">{t("reorderPoint")}</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatQuantity(results.reorderPoint)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("units")}</p>
                </div>

                {/* Safety Stock */}
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">{t("safetyStock")}</p>
                  <p className="text-3xl font-bold">
                    {formatQuantity(results.safetyStock)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("units")}</p>
                </div>
              </div>

              {/* Current Stock Status (if provided) */}
              {parsedInputs.currentStock !== undefined && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{t("currentStock")}</span>
                    </div>
                    <span className="font-medium">
                      {formatQuantity(parsedInputs.currentStock)} {t("units")}
                    </span>
                  </div>

                  {/* Days Until Stockout */}
                  {results.daysUntilStockout !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t("daysUntilStockout")}</span>
                      </div>
                      <span className={`font-medium ${
                        results.urgencyLevel === 'critical' ? 'text-destructive' :
                        results.urgencyLevel === 'warning' ? 'text-yellow-600 dark:text-yellow-500' :
                        'text-green-600 dark:text-green-500'
                      }`}>
                        {formatDays(results.daysUntilStockout)}
                      </span>
                    </div>
                  )}

                  {/* Projected Stockout Date */}
                  {results.projectedStockoutDate && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{t("projectedStockoutDate")}</span>
                      </div>
                      <span className={`font-medium ${
                        results.urgencyLevel === 'critical' ? 'text-destructive' : ''
                      }`}>
                        {formatDate(results.projectedStockoutDate)}
                      </span>
                    </div>
                  )}

                  {/* Reorder Status */}
                  <div className={`p-4 rounded-lg ${getUrgencyStyles(results.urgencyLevel).bgColor}`}>
                    <div className="flex items-start gap-3">
                      {(() => {
                        const styles = getUrgencyStyles(results.urgencyLevel);
                        const Icon = styles.icon;
                        return <Icon className={`h-5 w-5 ${styles.textColor} shrink-0 mt-0.5`} />;
                      })()}
                      <div>
                        <p className={`font-medium ${getUrgencyStyles(results.urgencyLevel).textColor}`}>
                          {results.needsReorder ? t("reorderNeeded") : t("stockSufficient")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {results.urgencyLevel === 'critical' && t("criticalWarning")}
                          {results.urgencyLevel === 'warning' && t("warningMessage")}
                          {results.urgencyLevel === 'normal' && t("normalMessage")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Order Quantity */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("recommendedOrderQuantity")}</span>
                  <span className="text-lg font-semibold">
                    {formatQuantity(results.recommendedOrderQuantity)} {t("units")}
                  </span>
                </div>
              </div>

              {/* Formula Explanation */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  {t("formulaExplanation")}
                </p>
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

          {/* Export Buttons */}
          <ExportButtons
            data={exportData}
            filename="safety-stock"
            title={t("title")}
            copyText={copyText}
          />
        </>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="safetyStockCalculator" />
    </div>
  );
}
