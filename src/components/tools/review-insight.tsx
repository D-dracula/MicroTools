"use client";

/**
 * AI Review Insight Component
 * Sentiment analysis and pain point extraction from customer reviews
 * 
 * Requirements: 3.6, 3.7
 */

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  Star,
  Loader2,
  FileText,
  TrendingUp,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { ParsedFile } from "@/lib/ai-tools/file-parser";
import {
  analyzeReviews,
  parseReviewsData,
  parseTextReviews,
  estimateAnalysisTokens,
  getSentimentLabel,
  getSeverityLabel,
  getSeverityColor,
  type ReviewInsightResult,
} from "@/lib/ai-tools/review-insight";
import { 
  SEOContent, 
  ExportButtons, 
  ApiKeyManager, 
  AIFileUpload,
  AIPreferencesSelector,
  ExampleFileDownload,
  useResponseLanguage,
  type ExportData 
} from "@/components/tools/shared";
type AnalysisStatus = 'idle' | 'parsing' | 'analyzing' | 'complete' | 'error';

export function ReviewInsight() {
  const t = useTranslations("tools.reviewInsight");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);
  void resultCardRef; // Suppress unused warning

  // State
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [pendingFile, setPendingFile] = useState<ParsedFile | null>(null);
  const [results, setResults] = useState<ReviewInsightResult | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [estimatedTokens, setEstimatedTokens] = useState<number>(0);

  // Language preferences
  const { responseLanguage } = useResponseLanguage();

  // Handle file processed - start analysis directly
  const handleFileProcessed = useCallback(async (result: ParsedFile) => {
    setResults(null);
    setStatus('idle');
    setErrorMessage('');
    
    // If API key is available, start analysis immediately
    if (apiKey && result.success) {
      await startAnalysis(result);
    }
  }, [apiKey]);

  // Start analysis directly
  const startAnalysis = useCallback(async (fileToUse?: ParsedFile) => {
    const file = fileToUse || pendingFile;
    if (!apiKey || !file?.success) return;

    setStatus('parsing');
    
    try {
      const analysisResults = await analyzeReviews(
        apiKey,
        file.data || [],
        file.headers || [],
        {
          locale: responseLanguage,
          rawText: file.rawText
        }
      );
      
      setResults(analysisResults);
      setStatus('complete');
      toast.success(isRTL ? 'تم التحليل بنجاح' : 'Analysis complete');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed';
      setErrorMessage(message);
      setStatus('error');
      toast.error(message);
    }
  }, [apiKey, pendingFile, responseLanguage, isRTL]);

  // Handle file error
  const handleFileError = useCallback((error: string) => {
    setErrorMessage(error);
    setStatus('error');
    toast.error(error);
  }, []);

  // Auto-start analysis when API key becomes available
  useEffect(() => {
    if (isApiKeyValid && pendingFile && status === 'idle') {
      startAnalysis();
    }
  }, [isApiKeyValid, pendingFile, status, startAnalysis]);

  // Reset analysis
  const resetAnalysis = useCallback(() => {
    setPendingFile(null);
    setResults(null);
    setStatus('idle');
    setErrorMessage('');
    setEstimatedTokens(0);
  }, []);

  // Get sentiment icon
  const _getSentimentIcon = (sentiment: 'positive' | 'negative' | 'neutral') => {
    const icons: Record<string, React.ReactNode> = {
      positive: <ThumbsUp className="h-4 w-4 text-green-600" />,
      negative: <ThumbsDown className="h-4 w-4 text-red-600" />,
      neutral: <Minus className="h-4 w-4 text-gray-600" />,
    };
    return icons[sentiment];
  };

  // Generate copy text
  const copyText = useMemo(() => {
    if (!results) return "";
    const dist = results.sentimentDistribution;
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("totalReviews")}: ${dist.total}
${t("positive")}: ${dist.positive} (${((dist.positive / dist.total) * 100).toFixed(1)}%)
${t("negative")}: ${dist.negative} (${((dist.negative / dist.total) * 100).toFixed(1)}%)
${t("neutral")}: ${dist.neutral} (${((dist.neutral / dist.total) * 100).toFixed(1)}%)
━━━━━━━━━━━━━━━━━━
${t("painPoints")}:
${results.painPoints.slice(0, 3).map(p => `- ${p.issue}`).join('\n')}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, t, isRTL]);

  // Export data
  const exportData: ExportData = useMemo(() => ({
    inputs: {},
    results: results ? {
      [t("positive")]: `${results.sentimentDistribution.positive} (${((results.sentimentDistribution.positive / results.sentimentDistribution.total) * 100).toFixed(1)}%)`,
      [t("negative")]: `${results.sentimentDistribution.negative} (${((results.sentimentDistribution.negative / results.sentimentDistribution.total) * 100).toFixed(1)}%)`,
      [t("neutral")]: `${results.sentimentDistribution.neutral} (${((results.sentimentDistribution.neutral / results.sentimentDistribution.total) * 100).toFixed(1)}%)`,
      [t("painPointsCount")]: String(results.painPoints.length),
      [t("praisedFeaturesCount")]: String(results.praisedFeatures.length),
    } : {},
    metadata: {
      toolName: t("title"),
      date: new Date().toLocaleDateString(locale),
      locale,
    },
  }), [results, t, locale]);

  const showResults = status === 'complete' && results;
  const canAnalyze = isApiKeyValid && pendingFile && pendingFile.data && pendingFile.data.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* API Key Section */}
      <ApiKeyManager
        onApiKeyChange={setApiKey}
        onValidationChange={setIsApiKeyValid}
        estimatedTokens={estimatedTokens}
      />

      {/* Language Preferences */}
      <AIPreferencesSelector showCurrency={false} />

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" aria-hidden="true" />
            {t("uploadReviews")}
          </CardTitle>
          <CardDescription>{t("uploadDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Example File Download */}
          <ExampleFileDownload
            toolName="review-insight"
            requiredColumns={[
              'ReviewID', 'ProductName', 'Rating', 'ReviewText', 'ReviewDate'
            ]}
            optionalColumns={['CustomerName', 'Verified', 'HelpfulVotes', 'ProductCategory']}
          />
          
          <AIFileUpload
            onFileProcessed={handleFileProcessed}
            onError={handleFileError}
            toolType="reviews"
            accept=".csv,.xlsx,.xls,.txt"
          />

          {/* File Info */}
          {pendingFile && pendingFile.data && pendingFile.data.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("totalReviews")}:</span>
                <span className="font-medium">{pendingFile.data.length}</span>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <div className="flex gap-2">
            <Button
              onClick={() => startAnalysis()}
              disabled={!canAnalyze || status === 'analyzing'}
              className="flex-1"
            >
              {status === 'analyzing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  {t("analyzing")}
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 me-2" />
                  {t("analyzeButton")}
                </>
              )}
            </Button>
            {(pendingFile || results) && (
              <Button variant="outline" onClick={resetAnalysis}>
                {commonT("reset")}
              </Button>
            )}
          </div>

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
          {/* Sentiment Distribution Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                {t("sentimentDistribution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Positive */}
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <ThumbsUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">
                    {results.sentimentDistribution.positive}
                  </p>
                  <p className="text-sm text-muted-foreground">{getSentimentLabel('positive', locale)}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {((results.sentimentDistribution.positive / results.sentimentDistribution.total) * 100).toFixed(1)}%
                  </p>
                </div>
                {/* Negative */}
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <ThumbsDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">
                    {results.sentimentDistribution.negative}
                  </p>
                  <p className="text-sm text-muted-foreground">{getSentimentLabel('negative', locale)}</p>
                  <p className="text-xs text-red-600 mt-1">
                    {((results.sentimentDistribution.negative / results.sentimentDistribution.total) * 100).toFixed(1)}%
                  </p>
                </div>
                {/* Neutral */}
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-700">
                  <Minus className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-600">
                    {results.sentimentDistribution.neutral}
                  </p>
                  <p className="text-sm text-muted-foreground">{getSentimentLabel('neutral', locale)}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {((results.sentimentDistribution.neutral / results.sentimentDistribution.total) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Sentiment Bar */}
              <div className="h-4 rounded-full overflow-hidden flex">
                <div 
                  className="bg-green-500 transition-all"
                  style={{ width: `${(results.sentimentDistribution.positive / results.sentimentDistribution.total) * 100}%` }}
                />
                <div 
                  className="bg-red-500 transition-all"
                  style={{ width: `${(results.sentimentDistribution.negative / results.sentimentDistribution.total) * 100}%` }}
                />
                <div 
                  className="bg-gray-400 transition-all"
                  style={{ width: `${(results.sentimentDistribution.neutral / results.sentimentDistribution.total) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pain Points */}
          {results.painPoints.length > 0 && (
            <Card className="border-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  {t("painPoints")} ({results.painPoints.length})
                </CardTitle>
                <CardDescription>{t("painPointsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.painPoints.map((point, index) => (
                    <div
                      key={index}
                      className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getSeverityColor(point.severity)}`} />
                          {point.issue}
                        </h5>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                            {point.frequency}x
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            point.severity === 'high' ? 'bg-red-600 text-white' :
                            point.severity === 'medium' ? 'bg-orange-500 text-white' :
                            'bg-yellow-500 text-black'
                          }`}>
                            {getSeverityLabel(point.severity, locale)}
                          </span>
                        </div>
                      </div>
                      {point.exampleReviews.length > 0 && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p className="text-xs mb-1">{t("exampleReview")}:</p>
                          <p className="italic text-xs bg-white/50 dark:bg-black/20 p-2 rounded">
                            "{point.exampleReviews[0]}..."
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Praised Features */}
          {results.praisedFeatures.length > 0 && (
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <ThumbsUp className="h-5 w-5" />
                  {t("praisedFeatures")} ({results.praisedFeatures.length})
                </CardTitle>
                <CardDescription>{t("praisedFeaturesDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.praisedFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {feature.feature}
                        </h5>
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                          {feature.frequency}x
                        </span>
                      </div>
                      {feature.exampleReviews.length > 0 && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p className="text-xs mb-1">{t("exampleReview")}:</p>
                          <p className="italic text-xs bg-white/50 dark:bg-black/20 p-2 rounded">
                            "{feature.exampleReviews[0]}..."
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          {(results.productImprovements.length > 0 || results.marketOpportunities.length > 0) && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Lightbulb className="h-5 w-5" />
                  {t("aiRecommendations")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Improvements */}
                {results.productImprovements.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      {t("productImprovements")}
                    </h4>
                    <ul className="space-y-2">
                      {results.productImprovements.map((improvement, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="text-sm">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Market Opportunities */}
                {results.marketOpportunities.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-purple-500" />
                      {t("marketOpportunities")}
                    </h4>
                    <ul className="space-y-2">
                      {results.marketOpportunities.map((opportunity, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="text-sm">{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Export Buttons */}
          <ExportButtons
            data={exportData}
            filename="review-insight"
            title={t("title")}
            copyText={copyText}
          />
        </>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="reviewInsight" />
    </div>
  );
}

export default ReviewInsight;
