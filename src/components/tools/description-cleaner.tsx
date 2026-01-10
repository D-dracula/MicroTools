"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eraser, Copy, Check, ArrowRight, ArrowLeft, FileText, Sparkles } from "lucide-react";
import {
  cleanDescription,
  getCleaningOptionLabels,
  getRemovedItemLabels,
  DEFAULT_CLEANER_OPTIONS,
  type CleanerOptions,
  type CleanerResult,
} from "@/lib/calculators/description-cleaner";

export function DescriptionCleaner() {
  const t = useTranslations("tools.descriptionCleaner");
  const locale = useLocale() as 'ar' | 'en';
  
  const [inputText, setInputText] = useState<string>("");
  const [options, setOptions] = useState<CleanerOptions>(DEFAULT_CLEANER_OPTIONS);
  const [copied, setCopied] = useState(false);

  const optionLabels = useMemo(() => getCleaningOptionLabels(locale), [locale]);
  const removedItemLabels = useMemo(() => getRemovedItemLabels(locale), [locale]);

  // Clean description in real-time
  const result: CleanerResult | null = useMemo(() => {
    if (!inputText.trim()) return null;

    return cleanDescription({
      text: inputText,
      options,
    });
  }, [inputText, options]);

  const handleOptionToggle = (optionKey: keyof CleanerOptions) => {
    setOptions(prev => ({
      ...prev,
      [optionKey]: !prev[optionKey],
    }));
  };

  const handleCopy = async () => {
    if (!result?.cleanedText) return;
    try {
      await navigator.clipboard.writeText(result.cleanedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClear = () => {
    setInputText("");
  };

  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  // Calculate reduction percentage
  const reductionPercent = result 
    ? Math.round(((result.originalLength - result.cleanedLength) / result.originalLength) * 100)
    : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eraser className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cleaning Options */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t("cleaningOptions")}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(Object.keys(options) as Array<keyof CleanerOptions>).map((optionKey) => (
                <label
                  key={optionKey}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    options[optionKey]
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted/50 border-transparent hover:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={options[optionKey]}
                    onChange={() => handleOptionToggle(optionKey)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{optionLabels[optionKey]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="inputText" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("inputText")}
              </Label>
              {inputText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {t("clear")}
                </Button>
              )}
            </div>
            <textarea
              id="inputText"
              placeholder={locale === 'ar' 
                ? 'الصق وصف المنتج هنا...' 
                : 'Paste your product description here...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full min-h-[200px] p-4 rounded-lg border bg-background resize-y text-sm leading-relaxed"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            />
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' 
                ? `${inputText.length} حرف`
                : `${inputText.length} characters`
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                {t("cleanedText")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    {locale === 'ar' ? 'تم النسخ' : 'Copied'}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {t("copy")}
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Before/After Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Before */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">{t("before")}</Label>
                <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 min-h-[150px] max-h-[300px] overflow-y-auto border border-red-200 dark:border-red-900">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-red-900 dark:text-red-100" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                    {inputText}
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  {locale === 'ar' 
                    ? `${result.originalLength} حرف`
                    : `${result.originalLength} characters`
                  }
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden lg:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <ArrowIcon className="h-6 w-6 text-muted-foreground" />
              </div>

              {/* After */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">{t("after")}</Label>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 min-h-[150px] max-h-[300px] overflow-y-auto border border-green-200 dark:border-green-900">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-green-900 dark:text-green-100" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                    {result.cleanedText}
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  {locale === 'ar' 
                    ? `${result.cleanedLength} حرف`
                    : `${result.cleanedLength} characters`
                  }
                </p>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">{result.originalLength}</p>
                <p className="text-xs text-muted-foreground">{t("originalChars")}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{result.cleanedLength}</p>
                <p className="text-xs text-muted-foreground">{t("cleanedChars")}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{result.originalLength - result.cleanedLength}</p>
                <p className="text-xs text-muted-foreground">{t("removedChars")}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{reductionPercent}%</p>
                <p className="text-xs text-muted-foreground">{t("reduction")}</p>
              </div>
            </div>

            {/* Removed Items Report */}
            {result.removedItems.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">{t("removedItems")}</Label>
                <div className="flex flex-wrap gap-2">
                  {result.removedItems.map((item) => (
                    <span
                      key={item.type}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm"
                    >
                      {removedItemLabels[item.type] || item.type}: {item.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!inputText && (
        <p className="text-sm text-muted-foreground text-center" role="status">
          {locale === 'ar' 
            ? 'الصق نص وصف المنتج للبدء في التنظيف'
            : 'Paste your product description text to start cleaning'
          }
        </p>
      )}
    </div>
  );
}
