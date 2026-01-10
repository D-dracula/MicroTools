"use client";

/**
 * AI Inventory Forecaster Component
 * Predicts inventory stockout dates and generates reorder recommendations
 * 
 * Requirements: 5.7
 */

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Calendar,
  Loader2,
  FileSpreadsheet,
  Clock,
  ShoppingCart,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { ParsedFile } from "@/lib/ai-tools/file-parser";
import {
  forecastInventory,
  parseSalesHistory,
  estimateForecastTokens,
  formatNumber,
  formatDate,
  getUrgencyLabel,
  getUrgencyColor,
  type InventoryForecastResult,
  type ParsedSalesData,
  type ProductPrediction,
  type UrgentAlert,
  type SeasonalPattern,
} from "@/lib/ai-tools/inventory-forecaster";
import { 
  SEOContent, 
  ExportButtons, 
  ApiKeyManager, 
  AIFileUpload,
  AIPreferencesSelector,
  ExampleFileDownload,
  useResponseLanguage,
  useDisplayCurrency,
  type ExportData 
} from "@/components/tools/shared";

type ForecastStatus = 'idle' | 'parsing' | 'forecasting' | 'complete' | 'error';

export function InventoryForecaster() {
  const t = useTranslations("tools.inventoryForecaster");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // State
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [results, setResults] = useState<InventoryForecastResult | null>(null);
  const [status, setStatus] = useState<ForecastStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [estimatedTokens, setEstimatedTokens] = useState<number>(0);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(14);

  // Language and Currency preferences
  const { responseLanguage } = useResponseLanguage();
  const { displayCurrency, formatAmount } = useDisplayCurrency();

  // Handle file processed - start analysis directly
  const handleFileProcessed = useCallback(async (result: ParsedFile) => {
    setParsedFile(result);
    setResults(null);
    setStatus('idle');
    setErrorMessage('');
    
    // If API key is available, start analysis immediately
    if (apiKey && result.success && result.data && result.headers) {
      await startAnalysis(result);
    }
  }, [apiKey]);

  // Start analysis directly
  const startAnalysis = useCallback(async (fileToUse?: ParsedFile) => {
    const file = fileToUse || parsedFile;
    if (!apiKey || !file?.success || !file.data || !file.headers) return;

    setStatus('parsing');
    
    try {
      const headers = Array.isArray(file.headers) 
        ? file.headers 
        : Object.keys(file.headers);
      
      const forecastResults = await forecastInventory(
        apiKey,
        file.data,
        headers,
        {
          locale: responseLanguage,
          currency: displayCurrency,
          leadTimeDays
        }
      );
      
      setResults(forecastResults);
      setStatus('complete');
      toast.success(isRTL ? 'تم التنبؤ بنجاح' : 'Forecast complete');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed';
      setErrorMessage(message);
      setStatus('error');
      toast.error(message);
    }
  }, [apiKey, parsedFile, responseLanguage, displayCurrency, leadTimeDays, isRTL]);

  // Handle file error
  const handleFileError = useCallback((error: string) => {
    setErrorMessage(error);
    setStatus('error');
    toast.error(error);
  }, []);

  // Auto-start analysis when API key becomes available
  useEffect(() => {
    if (isApiKeyValid && parsedFile && status === 'idle') {
      startAnalysis();
    }
  }, [isApiKeyValid, parsedFile, status, startAnalysis]);

  // Reset forecast
  const resetForecast = useCallback(() => {
    setParsedFile(null);
    setResults(null);
    setStatus('idle');
    setErrorMessage('');
    setEstimatedTokens(0);
  }, []);

  // Get trend icon component
  const getTrendIconComponent = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get urgency icon component
  const getUrgencyIconComponent = (urgency: 'critical' | 'warning' | 'normal') => {
    switch (urgency) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  // Generate copy text
  const copyText = useMemo(() => {
    if (!results) return "";
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("totalProducts")}: ${results.summary.totalProducts}
${t("criticalProducts")}: ${results.summary.criticalProducts}
${t("warningProducts")}: ${results.summary.warningProducts}
${t("healthyProducts")}: ${results.summary.healthyProducts}
━━━━━━━━━━━━━━━━━━
${t("urgentAlerts")}:
${results.urgentAlerts.slice(0, 3).map(a => `- ${isRTL ? a.messageArabic : a.message}`).join('\n')}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, t, isRTL]);

  // Export data
  const exportData: ExportData = useMemo(() => ({
    inputs: {
      [t("leadTime")]: `${leadTimeDays} ${t("days")}`,
    },
    results: results ? {
      [t("criticalProducts")]: String(results.summary.criticalProducts),
      [t("warningProducts")]: String(results.summary.warningProducts),
      [t("healthyProducts")]: String(results.summary.healthyProducts),
      [t("avgDaysUntilStockout")]: String(results.summary.averageDaysUntilStockout),
    } : {},
    metadata: {
      toolName: t("title"),
      date: new Date().toLocaleDateString(locale),
      locale,
    },
  }), [results, t, locale, leadTimeDays]);

  const canForecast = isApiKeyValid && parsedFile;
  const showResults = status === 'complete' && results;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* API Key Section */}
      <ApiKeyManager
        onApiKeyChange={setApiKey}
        onValidationChange={setIsApiKeyValid}
        estimatedTokens={estimatedTokens}
      />

      {/* Language & Currency Preferences */}
      <AIPreferencesSelector />

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
            {t("uploadSalesHistory")}
          </CardTitle>
          <CardDescription>{t("uploadDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Example File Download */}
          <ExampleFileDownload
            toolName="inventory-forecaster"
            requiredColumns={[
              'Date', 'ProductID', 'ProductName', 'QuantitySold', 
              'CurrentStock', 'ReorderLevel', 'UnitCost', 'SellingPrice'
            ]}
            optionalColumns={['Supplier', 'Category', 'LeadTimeDays']}
          />
          
          <AIFileUpload
            onFileProcessed={handleFileProcessed}
            onError={handleFileError}
            toolType="inventory"
            accept=".csv,.xlsx,.xls"
          />

          {/* Lead Time Input */}
          <div className="space-y-2">
            <Label htmlFor="leadTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("leadTimeDays")}
            </Label>
            <Input
              id="leadTime"
              type="number"
              min={1}
              max={90}
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 14)}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">{t("leadTimeDescription")}</p>
          </div>

          {/* Reset Button */}
          {(parsedFile || results) && (
            <Button variant="outline" onClick={resetForecast}>
              {commonT("reset")}
            </Button>
          )}

          {/* Error Message */}
          {status === 'error' && errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-sm text-destructive">{errorMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && results && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("inventorySummary")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Main Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("totalProducts")}</p>
                  <p className="text-lg font-bold">{formatNumber(results.summary.totalProducts, locale)}</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("criticalProducts")}</p>
                  <p className="text-lg font-bold text-red-600">{formatNumber(results.summary.criticalProducts, locale)}</p>
                </div>
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("warningProducts")}</p>
                  <p className="text-lg font-bold text-amber-600">{formatNumber(results.summary.warningProducts, locale)}</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("healthyProducts")}</p>
                  <p className="text-lg font-bold text-green-600">{formatNumber(results.summary.healthyProducts, locale)}</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="flex justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span>{t("totalStock")}: {formatNumber(results.summary.totalCurrentStock, locale)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{t("avgDaysUntilStockout")}: {formatNumber(results.summary.averageDaysUntilStockout, locale)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgent Alerts */}
          {results.urgentAlerts.length > 0 && (
            <Card className="border-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  {t("urgentAlerts")} ({results.urgentAlerts.length})
                </CardTitle>
                <CardDescription>{t("urgentAlertsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.urgentAlerts.map((alert, index) => (
                    <UrgentAlertCard
                      key={index}
                      alert={alert}
                      locale={locale}
                      isRTL={isRTL}
                      t={t}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Predictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t("productPredictions")}
              </CardTitle>
              <CardDescription>{t("productPredictionsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.predictions.slice(0, 10).map((prediction, index) => (
                  <ProductPredictionCard
                    key={index}
                    prediction={prediction}
                    locale={locale}
                    isRTL={isRTL}
                    t={t}
                    getTrendIconComponent={getTrendIconComponent}
                    getUrgencyIconComponent={getUrgencyIconComponent}
                  />
                ))}
                {results.predictions.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground">
                    {t("andMore", { count: results.predictions.length - 10 })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seasonality Patterns */}
          {results.seasonalityPatterns.length > 0 && (
            <Card className="border-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Calendar className="h-5 w-5" />
                  {t("seasonalPatterns")}
                </CardTitle>
                <CardDescription>{t("seasonalPatternsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.seasonalityPatterns.map((pattern, index) => (
                    <SeasonalPatternCard
                      key={index}
                      pattern={pattern}
                      locale={locale}
                      isRTL={isRTL}
                      t={t}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          {results.recommendations.length > 0 && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Lightbulb className="h-5 w-5" />
                  {t("aiRecommendations")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {results.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Hidden result card for export */}
          <div className="sr-only" ref={resultCardRef}>
            <div className="p-4 bg-white">
              <h2>{t("title")}</h2>
              <p>{t("criticalProducts")}: {results.summary.criticalProducts}</p>
            </div>
          </div>

          {/* Export Buttons */}
          <ExportButtons
            data={exportData}
            filename="inventory-forecast"
            title={t("title")}
            copyText={copyText}
          />
        </>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="inventoryForecaster" />
    </div>
  );
}

// Urgent Alert Card Component
interface UrgentAlertCardProps {
  alert: UrgentAlert;
  locale: string;
  isRTL: boolean;
  t: ReturnType<typeof useTranslations>;
}

function UrgentAlertCard({ alert, locale, isRTL, t }: UrgentAlertCardProps) {
  const isCritical = alert.severity === 'critical';
  
  return (
    <div
      className={`p-4 rounded-lg border ${
        isCritical 
          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
          : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
      }`}
    >
      <div className="flex items-start gap-3">
        {isCritical ? (
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <h5 className="font-medium mb-1">{alert.productName}</h5>
          <p className={`text-sm ${isCritical ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
            {isRTL ? alert.messageArabic : alert.message}
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("daysUntilStockout")}: {alert.daysUntilStockout}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Prediction Card Component
interface ProductPredictionCardProps {
  prediction: ProductPrediction;
  locale: string;
  isRTL: boolean;
  t: ReturnType<typeof useTranslations>;
  getTrendIconComponent: (trend: 'increasing' | 'stable' | 'decreasing') => React.ReactNode;
  getUrgencyIconComponent: (urgency: 'critical' | 'warning' | 'normal') => React.ReactNode;
}

function ProductPredictionCard({ 
  prediction, 
  locale, 
  isRTL, 
  t,
  getTrendIconComponent,
  getUrgencyIconComponent,
}: ProductPredictionCardProps) {
  return (
    <div className={`p-4 rounded-lg border ${getUrgencyColor(prediction.urgency)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getUrgencyIconComponent(prediction.urgency)}
          <h5 className="font-medium">{prediction.productName}</h5>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          prediction.urgency === 'critical' ? 'bg-red-100 text-red-700' :
          prediction.urgency === 'warning' ? 'bg-amber-100 text-amber-700' :
          'bg-green-100 text-green-700'
        }`}>
          {getUrgencyLabel(prediction.urgency, locale)}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="block text-xs text-muted-foreground">{t("currentStock")}</span>
          <span className="font-medium">{formatNumber(prediction.currentStock, locale)}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">{t("avgDailySales")}</span>
          <span className="font-medium flex items-center gap-1">
            {formatNumber(prediction.averageDailySales, locale)}
            {getTrendIconComponent(prediction.salesTrend)}
          </span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">{t("stockoutDate")}</span>
          <span className="font-medium">{formatDate(prediction.predictedStockoutDate, locale)}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">{t("daysUntilStockout")}</span>
          <span className={`font-medium ${
            prediction.daysUntilStockout <= 7 ? 'text-red-600' :
            prediction.daysUntilStockout <= 21 ? 'text-amber-600' :
            'text-green-600'
          }`}>
            {formatNumber(prediction.daysUntilStockout, locale)} {t("days")}
          </span>
        </div>
      </div>

      {prediction.urgency !== 'normal' && (
        <div className="mt-3 pt-3 border-t border-current/10">
          <div className="flex items-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4" />
            <span>
              {t("recommendedOrder")}: <strong>{formatNumber(prediction.recommendedOrderQuantity, locale)}</strong> {t("units")}
            </span>
            <span className="text-muted-foreground">
              ({t("orderBy")} {formatDate(prediction.recommendedOrderDate, locale)})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Seasonal Pattern Card Component
interface SeasonalPatternCardProps {
  pattern: SeasonalPattern;
  locale: string;
  isRTL: boolean;
  t: ReturnType<typeof useTranslations>;
}

function SeasonalPatternCard({ pattern, locale, isRTL, t }: SeasonalPatternCardProps) {
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <h5 className="font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          {isRTL ? pattern.periodArabic : pattern.period}
        </h5>
        <span className="text-sm font-medium text-blue-600">
          +{pattern.expectedDemandIncrease}% {t("demandIncrease")}
        </span>
      </div>
      <p className="text-sm text-blue-700 dark:text-blue-300">
        💡 {pattern.recommendation}
      </p>
      {pattern.affectedProducts.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          {t("affectedProducts")}: {pattern.affectedProducts.slice(0, 3).join(', ')}
          {pattern.affectedProducts.length > 3 && ` +${pattern.affectedProducts.length - 3}`}
        </div>
      )}
    </div>
  );
}

export default InventoryForecaster;
