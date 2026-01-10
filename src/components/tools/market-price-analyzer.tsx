"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown,
  Plus,
  X,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import {
  analyzeMarketPrice,
  validateMarketPriceInput,
  formatCurrency,
  formatPercentage,
  type MarketPriceInput,
  type MarketPriceResult,
} from "@/lib/calculators/market-price-analyzer";
import { SEOContent, ResultCard, ExportButtons, type ExportData } from "@/components/tools/shared";

/**
 * Market Price Positioning Analyzer Component
 * Analyzes product price compared to competitors to optimize pricing strategy
 * Requirements: 2.7
 */
export function MarketPriceAnalyzer() {
  const t = useTranslations("tools.marketPriceAnalyzer");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states
  const [myPrice, setMyPrice] = useState<string>("");
  const [competitorPrices, setCompetitorPrices] = useState<string[]>(["", "", ""]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Add competitor price input
  const addCompetitorPrice = useCallback(() => {
    setCompetitorPrices(prev => [...prev, ""]);
  }, []);

  // Remove competitor price input
  const removeCompetitorPrice = useCallback((index: number) => {
    if (competitorPrices.length > 3) {
      setCompetitorPrices(prev => prev.filter((_, i) => i !== index));
    }
  }, [competitorPrices.length]);

  // Update competitor price
  const updateCompetitorPrice = useCallback((index: number, value: string) => {
    setCompetitorPrices(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);


  // Parse input values
  const parsedInputs = useMemo((): Partial<MarketPriceInput> => {
    const parsedMyPrice = parseFloat(myPrice) || undefined;
    const parsedCompetitorPrices = competitorPrices
      .map(p => parseFloat(p))
      .filter(p => !isNaN(p) && p > 0);
    
    return {
      myPrice: parsedMyPrice,
      competitorPrices: parsedCompetitorPrices.length > 0 ? parsedCompetitorPrices : undefined,
    };
  }, [myPrice, competitorPrices]);

  // Calculate results
  const results: MarketPriceResult | null = useMemo(() => {
    const validation = validateMarketPriceInput(parsedInputs);
    
    if (!validation.isValid) {
      setValidationError(validation.error || null);
      return null;
    }
    
    setValidationError(null);
    
    return analyzeMarketPrice({
      myPrice: parsedInputs.myPrice!,
      competitorPrices: parsedInputs.competitorPrices!,
    });
  }, [parsedInputs]);

  const hasValidInputs = results !== null;
  const showResults = hasValidInputs && results;

  // Get category color and label
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'budget':
        return { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: t("categories.budget") };
      case 'value':
        return { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: t("categories.value") };
      case 'premium':
        return { color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', label: t("categories.premium") };
      case 'luxury':
        return { color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', label: t("categories.luxury") };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', label: category };
    }
  };

  // Get recommendation icon
  const getRecommendationIcon = (action: string) => {
    switch (action) {
      case 'increase':
        return <ArrowUp className="h-5 w-5 text-green-500" />;
      case 'decrease':
        return <ArrowDown className="h-5 w-5 text-orange-500" />;
      case 'maintain':
        return <Minus className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results || !parsedInputs.myPrice) return "";
    const categoryStyle = getCategoryStyle(results.positionCategory);
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("myPrice")}: ${formatCurrency(parsedInputs.myPrice)}
${t("competitorPrices")}: ${parsedInputs.competitorPrices?.map(p => formatCurrency(p)).join(", ")}
━━━━━━━━━━━━━━━━━━
${t("pricePosition")}: ${formatPercentage(results.pricePosition)}
${t("category")}: ${categoryStyle.label}
${t("marketAverage")}: ${formatCurrency(results.marketAverage)}
${t("priceRange")}: ${formatCurrency(results.minPrice)} - ${formatCurrency(results.maxPrice)}
━━━━━━━━━━━━━━━━━━
${t("recommendation")}: ${results.recommendation.reasoning}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedInputs, t, isRTL]);

  // Export data for buttons
  const exportData: ExportData = useMemo(() => ({
    inputs: {
      [t("myPrice")]: formatCurrency(parsedInputs.myPrice || 0),
      [t("competitorPrices")]: parsedInputs.competitorPrices?.map(p => formatCurrency(p)).join(", ") || "",
    },
    results: results ? {
      [t("pricePosition")]: formatPercentage(results.pricePosition),
      [t("category")]: getCategoryStyle(results.positionCategory).label,
      [t("marketAverage")]: formatCurrency(results.marketAverage),
      [t("minPrice")]: formatCurrency(results.minPrice),
      [t("maxPrice")]: formatCurrency(results.maxPrice),
      [t("recommendation")]: results.recommendation.reasoning,
    } : {},
    metadata: {
      toolName: t("title"),
      date: new Date().toLocaleDateString(locale),
      locale,
    },
  }), [parsedInputs, results, t, locale]);

  // Result card data
  const resultCardInputs = useMemo(() => ({
    myPrice: { label: t("myPrice"), value: formatCurrency(parsedInputs.myPrice || 0) },
    competitors: { label: t("competitorCount"), value: String(parsedInputs.competitorPrices?.length || 0) },
  }), [parsedInputs, t]);

  const resultCardOutputs = useMemo(() => {
    if (!results) return {};
    return {
      position: { 
        label: t("pricePosition"), 
        value: formatPercentage(results.pricePosition), 
        highlight: true 
      },
      category: { 
        label: t("category"), 
        value: getCategoryStyle(results.positionCategory).label 
      },
      average: { 
        label: t("marketAverage"), 
        value: formatCurrency(results.marketAverage) 
      },
    };
  }, [results, t]);


  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* My Price Input */}
          <div className="space-y-2">
            <Label htmlFor="myPrice">{t("myPrice")}</Label>
            <Input
              id="myPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder={t("myPricePlaceholder")}
              value={myPrice}
              onChange={(e) => setMyPrice(e.target.value)}
            />
          </div>

          {/* Competitor Prices Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t("competitorPrices")}</Label>
              <span className="text-xs text-muted-foreground">
                {t("minimumCompetitors")}
              </span>
            </div>
            
            <div className="space-y-2">
              {competitorPrices.map((price, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={`${t("competitor")} ${index + 1}`}
                    value={price}
                    onChange={(e) => updateCompetitorPrice(index, e.target.value)}
                    aria-label={`${t("competitor")} ${index + 1} ${t("price")}`}
                  />
                  {competitorPrices.length > 3 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCompetitorPrice(index)}
                      aria-label={`${commonT("remove")} ${t("competitor")} ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addCompetitorPrice}
              className="w-full"
            >
              <Plus className="h-4 w-4 me-2" />
              {t("addCompetitor")}
            </Button>
          </div>

          {/* Validation Error */}
          {validationError && parsedInputs.myPrice && (
            <p className="text-sm text-destructive flex items-center gap-1" role="alert">
              <AlertTriangle className="h-4 w-4" />
              {validationError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results Section - Requirement 2.7 */}
      {showResults && results && (
        <>
          {/* Price Position Visual */}
          <Card role="region" aria-label={isRTL ? "نتائج التحليل" : "Analysis results"} aria-live="polite">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" aria-hidden="true" />
                {t("analysisResults")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Position Category Badge */}
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getCategoryStyle(results.positionCategory).bg}`}>
                  <span className={`text-lg font-bold ${getCategoryStyle(results.positionCategory).color}`}>
                    {getCategoryStyle(results.positionCategory).label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("positionDescription", { position: formatPercentage(results.pricePosition) })}
                </p>
              </div>

              {/* Visual Price Scale */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("budget")}</span>
                  <span>{t("value")}</span>
                  <span>{t("premium")}</span>
                  <span>{t("luxury")}</span>
                </div>
                <div className="relative h-4 bg-gradient-to-r from-blue-200 via-green-200 via-orange-200 to-purple-200 rounded-full">
                  {/* Position Marker */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary border-2 border-white rounded-full shadow-lg transition-all"
                    style={{ left: `calc(${Math.min(Math.max(results.pricePosition, 0), 100)}% - 8px)` }}
                    aria-label={`${t("yourPosition")}: ${formatPercentage(results.pricePosition)}`}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span>{formatCurrency(results.minPrice)}</span>
                  <span className="font-medium">{t("yourPrice")}: {formatCurrency(parsedInputs.myPrice!)}</span>
                  <span>{formatCurrency(results.maxPrice)}</span>
                </div>
              </div>

              {/* Market Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t("marketAverage")}</p>
                  <p className="text-lg font-bold">{formatCurrency(results.marketAverage)}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t("priceRange")}</p>
                  <p className="text-lg font-bold">{formatCurrency(results.priceRange)}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t("belowYou")}</p>
                  <p className="text-lg font-bold">{results.competitorAnalysis.belowMe}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t("aboveYou")}</p>
                  <p className="text-lg font-bold">{results.competitorAnalysis.aboveMe}</p>
                </div>
              </div>

              {/* Recommendation */}
              <div className={`p-4 rounded-lg border ${
                results.recommendation.action === 'increase' 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                  : results.recommendation.action === 'decrease'
                  ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                  : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-start gap-3">
                  {getRecommendationIcon(results.recommendation.action)}
                  <div>
                    <p className="font-medium">
                      {results.recommendation.action === 'increase' && t("recommendIncrease")}
                      {results.recommendation.action === 'decrease' && t("recommendDecrease")}
                      {results.recommendation.action === 'maintain' && t("recommendMaintain")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {results.recommendation.reasoning}
                    </p>
                    {results.recommendation.suggestedPrice && (
                      <p className="text-sm font-medium mt-2">
                        {t("suggestedPrice")}: {formatCurrency(results.recommendation.suggestedPrice)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning for high prices */}
              {results.recommendation.action !== 'increase' && results.pricePosition > 75 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {t("highPriceWarning")}
                    </p>
                  </div>
                </div>
              )}
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
            filename="market-price-analysis"
            title={t("title")}
            copyText={copyText}
          />
        </>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="marketPriceAnalyzer" />
    </div>
  );
}
