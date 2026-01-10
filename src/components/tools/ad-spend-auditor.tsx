"use client";

/**
 * Ad Spend Auditor Component - Simplified Direct Analysis
 * AI-powered campaign performance analysis
 * 
 * Requirements: 6.5, 6.7
 */

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Loader2,
  BarChart3,
  XCircle,
  ArrowUpCircle,
  MinusCircle,
  PauseCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ParsedFile } from "@/lib/ai-tools/file-parser";
import {
  auditAdSpend,
  estimateAuditTokens,
  formatCurrency,
  formatPercentage,
  getStatusLabel,
  getStatusColor,
  getActionLabel,
  getPlatformLabel,
  type AdAuditResult,
  type CampaignAnalysis,
  type CampaignRecommendation,
} from "@/lib/ai-tools/ad-spend-auditor-logic";
import { 
  SEOContent, 
  ExportButtons, 
  ApiKeyManager, 
  AIFileUpload,
  AILoadingScreen,
  AIPreferencesSelector,
  ExampleFileDownload,
  useResponseLanguage,
  useDisplayCurrency,
  type ExportData,
  type ProcessingStep 
} from "@/components/tools/shared";

type AnalysisStep = 'upload' | 'analyzing' | 'complete';
type AnalysisStatus = 'idle' | 'parsing' | 'analyzing' | 'complete' | 'error';

// Map status to processing step
const statusToStep: Record<AnalysisStatus, ProcessingStep> = {
  idle: 'parsing',
  parsing: 'parsing',
  analyzing: 'analyzing',
  complete: 'complete',
  error: 'parsing',
};

export function AdSpendAuditor() {
  const t = useTranslations("tools.adSpendAuditor");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // State
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [results, setResults] = useState<AdAuditResult | null>(null);
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
    
    // If API key is available, start analysis immediately
    if (apiKey && result.success && result.data && result.headers) {
      await startAnalysis(result);
    }
  }, [apiKey]);

  // Start analysis directly
  const startAnalysis = useCallback(async (fileToUse?: ParsedFile) => {
    const file = fileToUse || parsedFile;
    if (!apiKey || !file?.success || !file.data || !file.headers) return;

    setStep('analyzing');
    setStatus('parsing');
    
    try {
      const headers = Array.isArray(file.headers) 
        ? file.headers 
        : Object.keys(file.headers);
      
      const auditResults = await auditAdSpend(
        apiKey,
        file.data,
        headers,
        {
          locale: responseLanguage,
          currency: displayCurrency
        }
      );
      
      setResults(auditResults);
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
    setResults(null);
    setStep('upload');
    setStatus('idle');
    setErrorMessage('');
    setEstimatedTokens(0);
    setFileName('');
  }, []);

  // Get action icon component
  const getActionIconComponent = (action: 'stop' | 'reduce' | 'maintain' | 'increase') => {
    switch (action) {
      case 'stop':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'reduce':
        return <MinusCircle className="h-4 w-4 text-amber-500" />;
      case 'maintain':
        return <PauseCircle className="h-4 w-4 text-blue-500" />;
      case 'increase':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
    }
  };

  // Generate copy text
  const copyText = useMemo(() => {
    if (!results) return "";
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("totalAdSpend")}: ${formatAmount(results.summary.totalAdSpend)}
${t("totalRevenue")}: ${formatAmount(results.summary.totalRevenue)}
${t("totalProfit")}: ${formatAmount(results.summary.totalProfit)}
${t("overallROI")}: ${formatPercentage(results.summary.overallROI)}
${t("wastedBudget")}: ${formatAmount(results.summary.wastedBudget)}
━━━━━━━━━━━━━━━━━━
${t("profitableCampaigns")}: ${results.summary.profitableCampaigns}
${t("unprofitableCampaigns")}: ${results.summary.unprofitableCampaigns}
━━━━━━━━━━━━━━━━━━
Micro Tools`;
  }, [results, t, formatAmount]);

  // Export data
  const exportData: ExportData = useMemo(() => ({
    inputs: {
      [t("totalCampaigns")]: String(results?.summary.totalCampaigns || 0),
    },
    results: results ? {
      [t("totalAdSpend")]: formatAmount(results.summary.totalAdSpend),
      [t("totalRevenue")]: formatAmount(results.summary.totalRevenue),
      [t("totalProfit")]: formatAmount(results.summary.totalProfit),
      [t("overallROI")]: formatPercentage(results.summary.overallROI),
      [t("wastedBudget")]: formatAmount(results.summary.wastedBudget),
      [t("profitableCampaigns")]: String(results.summary.profitableCampaigns),
      [t("unprofitableCampaigns")]: String(results.summary.unprofitableCampaigns),
    } : {},
    metadata: {
      toolName: t("title"),
      date: new Date().toLocaleDateString(locale),
      locale,
    },
  }), [results, t, locale, formatAmount]);

  const showResults = step === 'complete' && results;
  const isProcessing = status === 'parsing' || status === 'analyzing';

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
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
            {t("uploadFile")}
          </CardTitle>
          <CardDescription>{t("uploadDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Example File Download */}
          <ExampleFileDownload
            toolName="ad-spend-auditor"
            requiredColumns={[
              'CampaignID', 'CampaignName', 'Platform', 'AdSpend', 
              'Impressions', 'Clicks', 'Conversions', 'Revenue'
            ]}
            optionalColumns={['StartDate', 'EndDate', 'CTR', 'CPC', 'ROAS']}
          />
          
          <AIFileUpload
            onFileProcessed={handleFileProcessed}
            onFileSelected={handleFileSelected}
            onError={handleFileError}
            toolType="ads"
            accept=".csv,.xlsx,.xls"
          />

          {/* Reset Button */}
          {(parsedFile || results) && (
            <Button variant="outline" onClick={resetAnalysis}>
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

      {/* Loading Screen */}
      <AILoadingScreen
        isVisible={isProcessing}
        currentStep={statusToStep[status]}
        fileName={fileName}
      />

      {/* Results Section */}
      {showResults && results && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t("auditSummary")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Main Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("totalAdSpend")}</p>
                  <p className="text-lg font-bold">{formatAmount(results.summary.totalAdSpend)}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("totalRevenue")}</p>
                  <p className="text-lg font-bold">{formatAmount(results.summary.totalRevenue)}</p>
                </div>
                <div className={`text-center p-3 rounded-lg ${results.summary.totalProfit >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                  <p className="text-xs text-muted-foreground mb-1">{t("totalProfit")}</p>
                  <p className={`text-lg font-bold ${results.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(results.summary.totalProfit)}
                  </p>
                </div>
              </div>

              {/* ROI and ROAS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`text-center p-3 rounded-lg ${results.summary.overallROI >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                  <p className="text-xs text-muted-foreground mb-1">{t("overallROI")}</p>
                  <p className={`text-lg font-bold ${results.summary.overallROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(results.summary.overallROI)}
                  </p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("overallROAS")}</p>
                  <p className="text-lg font-bold">{results.summary.overallROAS.toFixed(2)}x</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("wastedBudget")}</p>
                  <p className="text-lg font-bold text-red-600">{formatAmount(results.summary.wastedBudget)}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("averageCPA")}</p>
                  <p className="text-lg font-bold">{formatAmount(results.summary.averageCPA)}</p>
                </div>
              </div>

              {/* Campaign Status Distribution */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{t("profitableCampaigns")}</p>
                  <p className="text-lg font-bold text-green-600">{results.summary.profitableCampaigns}</p>
                </div>
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{t("breakEvenCampaigns")}</p>
                  <p className="text-lg font-bold text-amber-600">{results.summary.breakEvenCampaigns}</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{t("unprofitableCampaigns")}</p>
                  <p className="text-lg font-bold text-red-600">{results.summary.unprofitableCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t("campaignPerformance")}
              </CardTitle>
              <CardDescription>{t("campaignPerformanceDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.campaignPerformance.slice(0, 10).map((campaign, index) => (
                  <CampaignCard
                    key={index}
                    campaign={campaign}
                    locale={locale}
                    isRTL={isRTL}
                    t={t}
                    formatAmount={formatAmount}
                  />
                ))}
                {results.campaignPerformance.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground">
                    {t("andMore", { count: results.campaignPerformance.length - 10 })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {results.recommendations.length > 0 && (
            <Card className="border-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <Lightbulb className="h-5 w-5" />
                  {t("recommendations")} ({results.recommendations.filter(r => r.priority === 'high').length} {t("highPriority")})
                </CardTitle>
                <CardDescription>{t("recommendationsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.recommendations.map((rec, index) => (
                    <RecommendationCard
                      key={index}
                      recommendation={rec}
                      locale={locale}
                      isRTL={isRTL}
                      t={t}
                      getActionIconComponent={getActionIconComponent}
                      formatAmount={formatAmount}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          {results.aiInsights.length > 0 && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Lightbulb className="h-5 w-5" />
                  {t("aiInsights")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {results.aiInsights.map((insight, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm">{insight}</span>
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
              <p>{t("totalProfit")}: {formatAmount(results.summary.totalProfit)}</p>
            </div>
          </div>

          {/* Export Buttons */}
          <ExportButtons
            data={exportData}
            filename="ad-spend-audit"
            title={t("title")}
            copyText={copyText}
          />
        </>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="adSpendAuditor" />
    </div>
  );
}

// Campaign Card Component
interface CampaignCardProps {
  campaign: CampaignAnalysis;
  locale: string;
  isRTL: boolean;
  t: ReturnType<typeof useTranslations>;
  formatAmount: (amount: number) => string;
}

function CampaignCard({ campaign, locale, isRTL, t, formatAmount }: CampaignCardProps) {
  return (
    <div className={`p-4 rounded-lg border ${getStatusColor(campaign.status)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {campaign.status === 'profitable' ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : campaign.status === 'unprofitable' ? (
            <TrendingDown className="h-5 w-5 text-red-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
          <div>
            <h5 className="font-medium">{campaign.campaignName}</h5>
            <span className="text-xs text-muted-foreground">{getPlatformLabel(campaign.platform)}</span>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          campaign.status === 'profitable' ? 'bg-green-100 text-green-700' :
          campaign.status === 'unprofitable' ? 'bg-red-100 text-red-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {getStatusLabel(campaign.status, locale)}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="block text-xs text-muted-foreground">{t("spend")}</span>
          <span className="font-medium">{formatAmount(campaign.spend)}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">{t("revenue")}</span>
          <span className="font-medium">{formatAmount(campaign.revenue)}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">{t("profit")}</span>
          <span className={`font-medium ${campaign.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatAmount(campaign.profit)}
          </span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">{t("roi")}</span>
          <span className={`font-medium ${campaign.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(campaign.roi)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-current/10 text-xs">
        <div>
          <span className="block text-muted-foreground">{t("conversions")}</span>
          <span className="font-medium">{campaign.conversions}</span>
        </div>
        <div>
          <span className="block text-muted-foreground">{t("cpa")}</span>
          <span className="font-medium">{campaign.cpa === Infinity ? '∞' : formatAmount(campaign.cpa)}</span>
        </div>
        <div>
          <span className="block text-muted-foreground">{t("ctr")}</span>
          <span className="font-medium">{campaign.ctr.toFixed(2)}%</span>
        </div>
        <div>
          <span className="block text-muted-foreground">{t("roas")}</span>
          <span className="font-medium">{campaign.roas.toFixed(2)}x</span>
        </div>
      </div>
    </div>
  );
}

// Recommendation Card Component
interface RecommendationCardProps {
  recommendation: CampaignRecommendation;
  locale: string;
  isRTL: boolean;
  t: ReturnType<typeof useTranslations>;
  getActionIconComponent: (action: 'stop' | 'reduce' | 'maintain' | 'increase') => React.ReactNode;
  formatAmount: (amount: number) => string;
}

function RecommendationCard({ recommendation, locale, isRTL, t, getActionIconComponent, formatAmount }: RecommendationCardProps) {
  const priorityColors = {
    high: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
    medium: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
    low: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  };

  const actionColors = {
    stop: 'bg-red-100 text-red-700',
    reduce: 'bg-amber-100 text-amber-700',
    maintain: 'bg-blue-100 text-blue-700',
    increase: 'bg-green-100 text-green-700',
  };

  return (
    <div className={`p-4 rounded-lg border ${priorityColors[recommendation.priority]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getActionIconComponent(recommendation.action)}
          <h5 className="font-medium">{recommendation.campaignName}</h5>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${actionColors[recommendation.action]}`}>
          {getActionLabel(recommendation.action, locale)}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {recommendation.reason}
      </p>
      {recommendation.potentialSavings && recommendation.potentialSavings > 0 && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
          <span>{t("potentialSavings")}: {formatAmount(recommendation.potentialSavings)}</span>
        </div>
      )}
    </div>
  );
}

export default AdSpendAuditor;
