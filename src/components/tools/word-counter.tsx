"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Type, FileText, Clock, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { analyzeText, type WordCountResult } from "@/lib/calculators/word-counter";

export function WordCounter() {
  const t = useTranslations("tools.wordCounter");
  const locale = useLocale() as 'ar' | 'en';
  
  const [text, setText] = useState<string>("");

  // Analyze text in real-time
  const result: WordCountResult = useMemo(() => {
    return analyzeText({ text, language: locale });
  }, [text, locale]);

  const getSEOStatusColor = (status: 'short' | 'optimal' | 'long') => {
    switch (status) {
      case 'short':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'optimal':
        return 'text-green-600 dark:text-green-400';
      case 'long':
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getSEOStatusIcon = (status: 'short' | 'optimal' | 'long') => {
    switch (status) {
      case 'short':
        return <AlertTriangle className="h-5 w-5" />;
      case 'optimal':
        return <CheckCircle className="h-5 w-5" />;
      case 'long':
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getSEOStatusLabel = (status: 'short' | 'optimal' | 'long') => {
    if (locale === 'ar') {
      switch (status) {
        case 'short': return 'قصير';
        case 'optimal': return 'مثالي';
        case 'long': return 'طويل';
      }
    }
    switch (status) {
      case 'short': return 'Too Short';
      case 'optimal': return 'Optimal';
      case 'long': return 'Too Long';
    }
  };

  const getSEOStatusBg = (status: 'short' | 'optimal' | 'long') => {
    switch (status) {
      case 'short':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'optimal':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'long':
        return 'bg-red-100 dark:bg-red-900/30';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-input" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("enterText")}
            </Label>
            <textarea
              id="text-input"
              placeholder={locale === 'ar' 
                ? 'الصق وصف المنتج أو النص هنا...'
                : 'Paste your product description or text here...'
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[200px] p-4 rounded-md border border-input bg-background text-sm resize-y"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("statistics")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Word Count */}
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-3xl font-bold text-primary">{result.wordCount}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {locale === 'ar' ? 'كلمة' : 'Words'}
              </div>
            </div>

            {/* Character Count */}
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-3xl font-bold text-primary">{result.characterCount}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {locale === 'ar' ? 'حرف' : 'Characters'}
              </div>
            </div>

            {/* Characters (no spaces) */}
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-3xl font-bold text-primary">{result.characterCountNoSpaces}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {locale === 'ar' ? 'حرف (بدون مسافات)' : 'Chars (no spaces)'}
              </div>
            </div>

            {/* Sentence Count */}
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-3xl font-bold text-primary">{result.sentenceCount}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {locale === 'ar' ? 'جملة' : 'Sentences'}
              </div>
            </div>

            {/* Paragraph Count */}
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-3xl font-bold text-primary">{result.paragraphCount}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {locale === 'ar' ? 'فقرة' : 'Paragraphs'}
              </div>
            </div>

            {/* Reading Time */}
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
                <Clock className="h-6 w-6" />
                {result.readingTimeMinutes}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {locale === 'ar' ? 'دقيقة للقراءة' : 'Min read'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Status Section */}
      {text.trim() !== '' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t("seoAnalysis")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SEO Status Indicator */}
            <div className={`p-4 rounded-lg ${getSEOStatusBg(result.seoStatus)} flex items-center gap-3`}>
              <div className={getSEOStatusColor(result.seoStatus)}>
                {getSEOStatusIcon(result.seoStatus)}
              </div>
              <div>
                <div className={`font-semibold ${getSEOStatusColor(result.seoStatus)}`}>
                  {getSEOStatusLabel(result.seoStatus)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {locale === 'ar' 
                    ? `${result.wordCount} كلمة - الطول المثالي: 150-300 كلمة`
                    : `${result.wordCount} words - Optimal: 150-300 words`
                  }
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{locale === 'ar' ? 'قصير' : 'Short'}</span>
                <span>{locale === 'ar' ? 'مثالي' : 'Optimal'}</span>
                <span>{locale === 'ar' ? 'طويل' : 'Long'}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    result.seoStatus === 'short' ? 'bg-yellow-500' :
                    result.seoStatus === 'optimal' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (result.wordCount / 500) * 100)}%` 
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>150</span>
                <span>300</span>
                <span>500+</span>
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'التوصيات' : 'Recommendations'}</Label>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li 
                      key={index} 
                      className="text-sm p-3 rounded-md bg-muted/50 flex items-start gap-2"
                    >
                      <span className="text-primary mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
