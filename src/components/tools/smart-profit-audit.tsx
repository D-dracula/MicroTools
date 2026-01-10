"use client";

/**
 * Smart Profit Audit Component
 * AI-powered sales file analysis and expense classification
 * 
 * Requirements: 2.5, 2.7
 */

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Package,
  Loader2,
  FileSpreadsheet,
  DollarSign,
  Truck,
  CreditCard,
  RotateCcw,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { ParsedFile } from "@/lib/ai-tools/file-parser";
import {
  analyzeProfit,
  parseSalesData,
  estimateAnalysisTokens,
  formatCurrency,
  formatPercentage,
  getCategoryLabel,
  type SmartProfitResult,
  type SalesFileData,
  type ExpenseCategory,
} from "@/lib/ai-tools/smart-profit-audit";
import { 
  SEOContent, 
  ExportButtons, 
  ApiKeyManager, 
  AIFileUpload,
  AILoadingScreen,
  AIDataQualityAlert,
  AIPreferencesSelector,
  ExampleFileDownload,
  useResponseLanguage,
  useDisplayCurrency,
  type ExportData,
  type ProcessingStep 
} from "@/components/tools/shared";

type AnalysisStep = 'upload' | 'analyzing' | 'complete';
type AnalysisStatus = 'idle' | 'detecting' | 'parsing' | 'classifying' | 'calculating' | 'analyzing' | 'complete' | 'error';

// Map status to processing step
const statusToStep: Record<AnalysisStatus, ProcessingStep> = {
  idle: 'parsing',
  detecting: 'parsing',
  parsing: 'parsing',
  classifying: 'classifying',
  calculating: 'calculating',
  analyzing: 'analyzing',
  complete: 'complete',
  error: 'parsing',
};

export function SmartProfitAudit() {
  const t = useTranslations("tools.smartProfitAudit");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // State
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [salesData, setSalesData] = useState<SalesFileData | null>(null);
  const [results, setResults] = useState<SmartProfitResult | null>(null);
  const [step, setStep] = useState<AnalysisStep>('upload');
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [estimatedTokens, setEstimatedTokens] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('');
  
  // Language and Currency preferences
  const { responseLanguage } = useResponseLanguage();
  const { displayCurrency, formatAmount } = useDisplayCurrency();

  // Handle file processed - start analysis directly
  const handleFileProcessed = useCallback(async (result: ParsedFile) => {
    setParsedFile(result);
    setResults(null);
    setStatus('idle');
    setErrorMessage('');
    setSalesData(null);
    
    // If API key is available, start analysis immediately
    if (apiKey && result.success && result.data && result.headers) {
      await startAnalysis(result);
    }
  }, [apiKey]);

  // Start analysis directly
  const startAnalysis = useCallback(async (file?: ParsedFile) => {
    const fileToUse = file || parsedFile;
    if (!apiKey || !fileToUse?.success || !fileToUse.data || !fileToUse.headers) return;

    setStep('analyzing');
    setStatus('parsing');
    
    try {
      const headers = Array.isArray(fileToUse.headers) 
        ? fileToUse.headers 
        : Object.keys(fileToUse.headers);
      
      // First parse the sales data
      const salesData = await parseSalesData(
        apiKey,
        fileToUse.data,
        headers,
        fileToUse.platform || 'unknown'
      );
      
      setSalesData(salesData);
      
      // Then analyze the parsed data
      const results = await analyzeProfit(
        apiKey,
        salesData,
        responseLanguage,
        {
          locale: responseLanguage,
          currency: displayCurrency
        }
      );
      
      setResults(results);
      setEstimatedTokens(results.tokensUsed || 0);
      setStep('complete');
      setStatus('complete');
      toast.success(isRTL ? 'تم التحليل بنجاح' : 'Analysis complete');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed';
      setErrorMessage(message);
      setStatus('error');
      toast.error(message);
    }
  }, [apiKey, parsedFile, responseLanguage, displayCurrency, isRTL]);

  // Handle file selected - store file name for loading screen
  const handleFileSelected = useCallback((name: string) => {
    setFileName(name);
  }, []);

  // Auto-start analysis when API key becomes available
  useEffect(() => {
    if (isApiKeyValid && parsedFile && step === 'upload') {
      startAnalysis();
    }
  }, [isApiKeyValid, parsedFile, step, startAnalysis]);

  // Handle file error
  const handleFileError = useCallback((error: string) => {
    setErrorMessage(error);
    setStatus('error');
    toast.error(error);
  }, []);

  // Reset analysis
  const resetAnalysis = useCallback(() => {
    setParsedFile(null);
    setSalesData(null);
    setResults(null);
    setStep('upload');
    setStatus('idle');
    setErrorMessage('');
    setEstimatedTokens(0);
    setFileName('');
    toast.success(isRTL ? 'تم إعادة تعيين الأداة' : 'Tool reset successfully');
  }, [isRTL]);

  // Get category icon
  const getCategoryIcon = (category: ExpenseCategory) => {
    const icons: Record<ExpenseCategory, React.ReactNode> = {
      payment_gateway: <CreditCard className="h-4 w-4" />,
      shipping: <Truck className="h-4 w-4" />,
      tax: <DollarSign className="h-4 w-4" />,
      refund: <RotateCcw className="h-4 w-4" />,
      other: <MoreHorizontal className="h-4 w-4" />,
    };
    return icons[category];
  };

  // Get category color
  const getCategoryColor = (category: ExpenseCategory) => {
    const colors: Record<ExpenseCategory, string> = {
      payment_gateway: 'bg-purple-500',
      shipping: 'bg-orange-500',
      tax: 'bg-blue-500',
      refund: 'bg-red-500',
      other: 'bg-gray-500',
    };
    return colors[category];
  };

  // Generate copy text
  const copyText = useMemo(() => {
    if (!results) return "";
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("totalRevenue")}: ${formatAmount(results.summary.totalRevenue)}
${t("totalCosts")}: ${formatAmount(results.summary.totalCosts)}
${t("netProfit")}: ${formatAmount(results.summary.netProfit)}
${t("profitMargin")}: ${formatPercentage(results.summary.profitMargin)}
━━━━━━━━━━━━━━━━━━
${t("costBreakdown")}:
- ${getCategoryLabel('payment_gateway', locale)}: ${formatAmount(results.costBreakdown.paymentGatewayFees)}
- ${getCategoryLabel('shipping', locale)}: ${formatAmount(results.costBreakdown.shippingCosts)}
- ${getCategoryLabel('tax', locale)}: ${formatAmount(results.costBreakdown.taxes)}
- ${getCategoryLabel('refund', locale)}: ${formatAmount(results.costBreakdown.refunds)}
━━━━━━━━━━━━━━━━━━
Micro Tools`;
  }, [results, t, locale, isRTL, formatAmount]);

  // Export data
  const exportData: ExportData = useMemo(() => ({
    inputs: salesData ? {
      [t("platform")]: salesData.platform,
      [t("totalOrders")]: String(salesData.totalRows),
      [t("dateRange")]: salesData.dateRange?.start && salesData.dateRange?.end 
        ? `${salesData.dateRange.start} - ${salesData.dateRange.end}` 
        : '',
    } : {},
    results: results ? {
      [t("totalRevenue")]: formatAmount(results.summary.totalRevenue),
      [t("totalCosts")]: formatAmount(results.summary.totalCosts),
      [t("netProfit")]: formatAmount(results.summary.netProfit),
      [t("profitMargin")]: formatPercentage(results.summary.profitMargin),
      [t("profitableOrders")]: String(results.summary.profitableOrders),
      [t("unprofitableOrders")]: String(results.summary.unprofitableOrders),
    } : {},
    metadata: {
      toolName: t("title"),
      date: new Date().toLocaleDateString(locale),
      locale,
    },
  }), [salesData, results, t, locale, formatAmount]);

  const showResults = step === 'complete' && results;
  const isProcessing = ['detecting', 'parsing', 'classifying', 'calculating', 'analyzing'].includes(status);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* AI Loading Screen */}
      <AILoadingScreen
        isVisible={isProcessing}
        currentStep={statusToStep[status]}
        fileName={fileName}
      />
      
      {/* API Key Section */}
      <ApiKeyManager
        onApiKeyChange={setApiKey}
        onValidationChange={setIsApiKeyValid}
        estimatedTokens={estimatedTokens}
      />

      {/* Language & Currency Preferences */}
      <AIPreferencesSelector />

      {/* Step 1: File Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
              {t("uploadSalesFile")}
            </CardTitle>
            <CardDescription>{t("uploadDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Example File Download */}
            <ExampleFileDownload
              toolName="smart-profit-audit"
              requiredColumns={[
                'OrderID', 'ProductName', 'Quantity', 'UnitPrice', 
                'ShippingCost', 'PaymentFee', 'Tax', 'OrderDate'
              ]}
              optionalColumns={['RefundAmount', 'CustomerID', 'Country']}
            />
            
            <AIFileUpload
              onFileProcessed={handleFileProcessed}
              onFileSelected={handleFileSelected}
              onError={handleFileError}
              toolType="sales"
              accept=".csv,.xlsx,.xls"
            />

            {/* Error Message */}
            {status === 'error' && errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span className="text-sm text-destructive">{errorMessage}</span>
              </div>
            )}
            
            {/* Waiting for API Key */}
            {parsedFile && !isApiKeyValid && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  {isRTL ? 'أدخل مفتاح API للمتابعة' : 'Enter API key to continue'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {showResults && results && (
        <>
          {/* Summary Card */}
          <Card className={results.summary.netProfit >= 0 ? "border-green-500" : "border-destructive"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.summary.netProfit >= 0 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-green-500">{t("profitable")}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-5 w-5 text-destructive" />
                    <span className="text-destructive">{t("unprofitable")}</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Main Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("totalRevenue")}</p>
                  <p className="text-lg font-bold">{formatAmount(results.summary.totalRevenue)}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("totalCosts")}</p>
                  <p className="text-lg font-bold text-orange-600">{formatAmount(results.summary.totalCosts)}</p>
                </div>
                <div className={`text-center p-3 rounded-lg ${results.summary.netProfit >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                  <p className="text-xs text-muted-foreground mb-1">{t("netProfit")}</p>
                  <p className={`text-lg font-bold ${results.summary.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatAmount(results.summary.netProfit)}
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("profitMargin")}</p>
                  <p className={`text-lg font-bold ${results.summary.profitMargin >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatPercentage(results.summary.profitMargin)}
                  </p>
                </div>
              </div>

              {/* Order Stats */}
              <div className="flex justify-center gap-8 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>{t("profitableOrders")}: {results.summary.profitableOrders}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>{t("unprofitableOrders")}: {results.summary.unprofitableOrders}</span>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">{t("costBreakdown")}</h4>
                <div className="space-y-3">
                  {/* Payment Gateway */}
                  <CostBar
                    icon={getCategoryIcon('payment_gateway')}
                    label={getCategoryLabel('payment_gateway', locale)}
                    amount={results.costBreakdown.paymentGatewayFees}
                    total={results.summary.totalCosts}
                    color={getCategoryColor('payment_gateway')}
                    formatAmount={formatAmount}
                  />
                  {/* Shipping */}
                  <CostBar
                    icon={getCategoryIcon('shipping')}
                    label={getCategoryLabel('shipping', locale)}
                    amount={results.costBreakdown.shippingCosts}
                    total={results.summary.totalCosts}
                    color={getCategoryColor('shipping')}
                    formatAmount={formatAmount}
                  />
                  {/* Tax */}
                  <CostBar
                    icon={getCategoryIcon('tax')}
                    label={getCategoryLabel('tax', locale)}
                    amount={results.costBreakdown.taxes}
                    total={results.summary.totalCosts}
                    color={getCategoryColor('tax')}
                    formatAmount={formatAmount}
                  />
                  {/* Refunds */}
                  <CostBar
                    icon={getCategoryIcon('refund')}
                    label={getCategoryLabel('refund', locale)}
                    amount={results.costBreakdown.refunds}
                    total={results.summary.totalCosts}
                    color={getCategoryColor('refund')}
                    formatAmount={formatAmount}
                  />
                  {/* Other */}
                  {results.costBreakdown.otherCosts > 0 && (
                    <CostBar
                      icon={getCategoryIcon('other')}
                      label={getCategoryLabel('other', locale)}
                      amount={results.costBreakdown.otherCosts}
                      total={results.summary.totalCosts}
                      color={getCategoryColor('other')}
                      formatAmount={formatAmount}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Losing Products */}
          {results.losingProducts.length > 0 && (
            <Card className="border-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <Package className="h-5 w-5" />
                  {t("losingProducts")} ({results.losingProducts.length})
                </CardTitle>
                <CardDescription>{t("losingProductsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.losingProducts.slice(0, 5).map((product, index) => (
                    <div
                      key={index}
                      className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium">{product.productName}</h5>
                        <span className="text-destructive font-bold">
                          -{formatAmount(product.totalLoss)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground mb-2">
                        <div>
                          <span className="block text-xs">{t("orders")}</span>
                          <span className="font-medium text-foreground">{product.totalOrders}</span>
                        </div>
                        <div>
                          <span className="block text-xs">{t("avgLoss")}</span>
                          <span className="font-medium text-destructive">
                            -{formatAmount(product.averageLossPerOrder)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs">{t("mainCause")}</span>
                          <span className="font-medium text-foreground flex items-center gap-1">
                            {getCategoryIcon(product.lossReason)}
                            {getCategoryLabel(product.lossReason, locale)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 p-2 rounded">
                        💡 {product.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          {results.aiRecommendations.length > 0 && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Lightbulb className="h-5 w-5" />
                  {t("aiRecommendations")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {results.aiRecommendations.map((rec, index) => (
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
              <p>{t("netProfit")}: {formatAmount(results.summary.netProfit)}</p>
            </div>
          </div>

          {/* Export Buttons */}
          <ExportButtons
            data={exportData}
            filename="smart-profit-audit"
            title={t("title")}
            copyText={copyText}
          />

          {/* Reset Button */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={resetAnalysis} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {isRTL ? 'تحليل ملف جديد' : 'Analyze New File'}
            </Button>
          </div>
        </>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="smartProfitAudit" />
    </div>
  );
}

// Cost Bar Component
interface CostBarProps {
  icon: React.ReactNode;
  label: string;
  amount: number;
  total: number;
  color: string;
  formatAmount: (amount: number) => string;
}

function CostBar({ icon, label, amount, total, color, formatAmount }: CostBarProps) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="font-medium">
          {formatAmount(amount)}
          <span className="text-muted-foreground ms-1">
            ({percentage.toFixed(1)}%)
          </span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default SmartProfitAudit;
