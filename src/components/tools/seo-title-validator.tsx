"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, AlertCircle, AlertTriangle, CheckCircle, Lightbulb, Type } from "lucide-react";
import {
  validateSEOTitle,
  getScoreStatus,
  getLengthStatusLabel,
  getIssueTypeLabel,
  type SEOTitleResult,
  type SEOIssue,
} from "@/lib/calculators/seo-validator";

export function SEOTitleValidator() {
  const t = useTranslations("tools.seoTitleValidator");
  const locale = useLocale() as 'ar' | 'en';
  
  const [title, setTitle] = useState<string>("");

  // Validate title in real-time
  const result: SEOTitleResult | null = useMemo(() => {
    if (!title.trim()) return null;

    return validateSEOTitle({
      title,
      language: locale,
    });
  }, [title, locale]);

  const scoreStatus = result ? getScoreStatus(result.score, locale) : null;
  const lengthStatusLabel = result ? getLengthStatusLabel(result.lengthStatus, locale) : null;

  // Calculate progress bar color based on length
  const getProgressColor = () => {
    if (!result) return 'bg-gray-300';
    if (result.lengthStatus === 'optimal') return 'bg-green-500';
    if (result.lengthStatus === 'short') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate progress percentage (max at 70 chars for visual)
  const progressPercent = Math.min((title.length / 70) * 100, 100);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="seoTitle" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              {t("productTitle")}
            </Label>
            <Input
              id="seoTitle"
              type="text"
              placeholder={locale === 'ar' 
                ? 'أدخل عنوان المنتج للتحقق من توافقه مع SEO...' 
                : 'Enter your product title to check SEO compliance...'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            />
            
            {/* Character Counter Progress Bar */}
            <div className="space-y-1">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {title.length} {locale === 'ar' ? 'حرف' : 'characters'}
                  {result && ` (${lengthStatusLabel})`}
                </span>
                <span>
                  {locale === 'ar' ? 'المثالي: 50-60' : 'Optimal: 50-60'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <>
          {/* Score Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t("seoScore")}</p>
                  <p className={`text-4xl font-bold ${scoreStatus?.colorClass}`}>
                    {result.score}
                    <span className="text-lg font-normal text-muted-foreground">/100</span>
                  </p>
                  <p className={`text-sm font-medium ${scoreStatus?.colorClass}`}>
                    {scoreStatus?.label}
                  </p>
                </div>
                
                {/* Visual Score Indicator */}
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(result.score / 100) * 251.2} 251.2`}
                      className={scoreStatus?.colorClass.replace('text-', 'text-')}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {result.score >= 70 ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : result.score >= 50 ? (
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues Section */}
          {result.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  {t("issues")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.issues.map((issue: SEOIssue, index: number) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      issue.severity === 'error'
                        ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900'
                        : 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900'
                    }`}
                  >
                    {issue.severity === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className={`text-sm font-medium ${
                        issue.severity === 'error' ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {getIssueTypeLabel(issue.type, locale)}
                      </p>
                      <p className={`text-sm ${
                        issue.severity === 'error' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {issue.message}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Suggestions Section */}
          {result.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-blue-500" />
                  {t("suggestions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.suggestions.map((suggestion: string, index: number) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900"
                    >
                      <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {suggestion}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Perfect Score Message */}
          {result.score === 100 && (
            <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-300">
                      {locale === 'ar' ? 'عنوان مثالي!' : 'Perfect Title!'}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {locale === 'ar' 
                        ? 'عنوانك متوافق تماماً مع معايير SEO وجاهز للنشر'
                        : 'Your title is fully SEO compliant and ready to publish'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!title && (
        <p className="text-sm text-muted-foreground text-center" role="status">
          {locale === 'ar' 
            ? 'أدخل عنوان المنتج للتحقق من توافقه مع محركات البحث'
            : 'Enter a product title to check its SEO compliance'
          }
        </p>
      )}
    </div>
  );
}
