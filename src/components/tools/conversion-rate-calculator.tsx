"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle, Info } from "lucide-react";
import {
  calculateConversionRate,
  formatRate,
  getStatusColor,
  ECOMMERCE_BENCHMARKS,
  type ConversionRateResult,
  type TimePeriod,
} from "@/lib/calculators/conversion-rate";

export function ConversionRateCalculator() {
  const t = useTranslations("tools.conversionRateCalculator");
  const locale = useLocale();
  
  const [visitors, setVisitors] = useState<string>("");
  const [conversions, setConversions] = useState<string>("");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");

  // Parse input values to numbers
  const parsedVisitors = useMemo(() => {
    const value = parseInt(visitors, 10);
    return isNaN(value) ? undefined : value;
  }, [visitors]);

  const parsedConversions = useMemo(() => {
    const value = parseInt(conversions, 10);
    return isNaN(value) ? undefined : value;
  }, [conversions]);

  // Calculate results in real-time
  const results: ConversionRateResult | null = useMemo(() => {
    if (parsedVisitors === undefined || parsedConversions === undefined) {
      return null;
    }
    return calculateConversionRate(
      { visitors: parsedVisitors, conversions: parsedConversions, timePeriod },
      locale as 'ar' | 'en'
    );
  }, [parsedVisitors, parsedConversions, timePeriod, locale]);

  const hasValidInputs = parsedVisitors !== undefined && parsedConversions !== undefined;
  const showResults = results !== null && results.isValid;
  const showError = results !== null && !results.isValid;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'above':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'average':
        return <Target className="h-5 w-5 text-yellow-600" />;
      case 'below':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    if (locale === 'ar') {
      switch (status) {
        case 'excellent': return 'ممتاز';
        case 'above': return 'فوق المتوسط';
        case 'average': return 'متوسط';
        case 'below': return 'أقل من المتوسط';
        default: return status;
      }
    }
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'above': return 'Above Average';
      case 'average': return 'Average';
      case 'below': return 'Below Average';
      default: return status;
    }
  };

  const timePeriodOptions: { value: TimePeriod; label: string }[] = [
    { value: 'day', label: locale === 'ar' ? 'يوم' : 'Day' },
    { value: 'week', label: locale === 'ar' ? 'أسبوع' : 'Week' },
    { value: 'month', label: locale === 'ar' ? 'شهر' : 'Month' },
    { value: 'year', label: locale === 'ar' ? 'سنة' : 'Year' },
  ];

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
        <CardContent className="space-y-4">
          {/* Time Period Selector */}
          <div className="space-y-2">
            <Label htmlFor="timePeriod">{t("timePeriod")}</Label>
            <div className="flex flex-wrap gap-2">
              {timePeriodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTimePeriod(option.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timePeriod === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visitors Input */}
          <div className="space-y-2">
            <Label htmlFor="visitors">{t("visitors")}</Label>
            <Input
              id="visitors"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={visitors}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVisitors(e.target.value)}
              className="text-lg"
              dir="ltr"
            />
          </div>

          {/* Conversions Input */}
          <div className="space-y-2">
            <Label htmlFor="conversions">{t("conversions")}</Label>
            <Input
              id="conversions"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={conversions}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConversions(e.target.value)}
              className="text-lg"
              dir="ltr"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {showError && results?.error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{results.error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {showResults && results && (
        <>
          {/* Main Result */}
          <Card 
            className={`border-2 ${
              results.benchmark.status === 'excellent' ? 'border-green-500' :
              results.benchmark.status === 'above' ? 'border-blue-500' :
              results.benchmark.status === 'average' ? 'border-yellow-500' :
              'border-red-500'
            }`}
            role="region"
            aria-label={locale === "ar" ? "نتائج الحساب" : "Calculation results"}
            aria-live="polite"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(results.benchmark.status)}
                <span className={getStatusColor(results.benchmark.status)}>
                  {t("conversionRate")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className={`text-5xl font-bold ${getStatusColor(results.benchmark.status)}`}>
                  {formatRate(results.rate)}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {getStatusLabel(results.benchmark.status)}
                </div>
              </div>

              {/* Benchmark Comparison */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {t("benchmarkComparison")}
                </h4>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between text-xs">
                    <span>{locale === 'ar' ? 'ضعيف' : 'Poor'}</span>
                    <span>{locale === 'ar' ? 'متوسط' : 'Average'}</span>
                    <span>{locale === 'ar' ? 'جيد' : 'Good'}</span>
                    <span>{locale === 'ar' ? 'ممتاز' : 'Excellent'}</span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-muted">
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${(ECOMMERCE_BENCHMARKS.poor / ECOMMERCE_BENCHMARKS.excellent) * 100}%` }}
                    />
                    <div 
                      className="bg-yellow-500" 
                      style={{ width: `${((ECOMMERCE_BENCHMARKS.average - ECOMMERCE_BENCHMARKS.poor) / ECOMMERCE_BENCHMARKS.excellent) * 100}%` }}
                    />
                    <div 
                      className="bg-blue-500" 
                      style={{ width: `${((ECOMMERCE_BENCHMARKS.good - ECOMMERCE_BENCHMARKS.average) / ECOMMERCE_BENCHMARKS.excellent) * 100}%` }}
                    />
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${((ECOMMERCE_BENCHMARKS.excellent - ECOMMERCE_BENCHMARKS.good) / ECOMMERCE_BENCHMARKS.excellent) * 100}%` }}
                    />
                  </div>
                  {/* Marker for current rate */}
                  <div 
                    className="absolute top-6 w-0.5 h-4 bg-foreground transform -translate-x-1/2"
                    style={{ 
                      left: `${Math.min((results.rate / ECOMMERCE_BENCHMARKS.excellent) * 100, 100)}%` 
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-center mt-4">
                  {locale === 'ar' 
                    ? `متوسط التجارة الإلكترونية: ${ECOMMERCE_BENCHMARKS.average}%`
                    : `E-commerce average: ${ECOMMERCE_BENCHMARKS.average}%`
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {results.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("recommendations")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {results.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Validation Message */}
      {!hasValidInputs && (visitors !== "" || conversions !== "") && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterValidNumbers")}
        </p>
      )}
    </div>
  );
}
