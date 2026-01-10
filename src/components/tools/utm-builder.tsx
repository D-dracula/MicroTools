"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link2, Copy, Check, AlertCircle } from "lucide-react";
import {
  buildUTMUrl,
  UTM_PRESETS,
  type UTMResult,
} from "@/lib/calculators/utm-builder";
import { toast } from "sonner";

export function UTMBuilder() {
  const t = useTranslations("tools.utmBuilder");
  const locale = useLocale();
  
  const [url, setUrl] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [medium, setMedium] = useState<string>("");
  const [campaign, setCampaign] = useState<string>("");
  const [term, setTerm] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Generate UTM URL in real-time
  const result: UTMResult = useMemo(() => {
    if (!url) {
      return { fullUrl: '', isValid: false, missingParams: [] };
    }
    
    return buildUTMUrl({
      url,
      source,
      medium,
      campaign,
      term: term || undefined,
      content: content || undefined,
    });
  }, [url, source, medium, campaign, term, content]);

  // Apply preset - Requirement 2.2
  const handleApplyPreset = useCallback((presetId: string) => {
    const preset = UTM_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSource(preset.source);
      setMedium(preset.medium);
      toast.success(locale === 'ar' ? 'تم تطبيق القالب' : 'Preset applied');
    }
  }, [locale]);

  // Copy to clipboard handler - Requirement 2.5
  const handleCopy = useCallback(async () => {
    if (!result.isValid || !result.fullUrl) return;
    
    try {
      await navigator.clipboard.writeText(result.fullUrl);
      setCopied(true);
      toast.success(locale === 'ar' ? 'تم نسخ الرابط' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(locale === 'ar' ? 'فشل النسخ' : 'Failed to copy');
    }
  }, [result, locale]);

  const hasUrl = url.trim() !== '';
  const showMissingWarning = hasUrl && result.missingParams.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-500" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Destination URL - Required */}
          <div className="space-y-2">
            <Label htmlFor="url">{t("destinationUrl")} *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/product"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-lg font-mono"
              dir="ltr"
            />
          </div>

          {/* Presets - Requirement 2.2 */}
          <div className="space-y-2">
            <Label>{t("presets")}</Label>
            <div className="flex flex-wrap gap-2">
              {UTM_PRESETS.filter(p => 
                p.id.includes('tiktok') || p.id.includes('snapchat')
              ).map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyPreset(preset.id)}
                  className="text-xs"
                >
                  {locale === 'ar' ? preset.nameAr : preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* UTM Source - Required */}
          <div className="space-y-2">
            <Label htmlFor="source" className="flex items-center gap-1">
              {t("source")} *
              {result.missingParams.includes('source') && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </Label>
            <Input
              id="source"
              type="text"
              placeholder={locale === 'ar' ? 'مثال: tiktok, snapchat' : 'e.g., tiktok, snapchat'}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className={result.missingParams.includes('source') ? 'border-destructive' : ''}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'مصدر الزيارة (المنصة)' : 'Traffic source (platform)'}
            </p>
          </div>

          {/* UTM Medium - Required */}
          <div className="space-y-2">
            <Label htmlFor="medium" className="flex items-center gap-1">
              {t("medium")} *
              {result.missingParams.includes('medium') && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </Label>
            <Input
              id="medium"
              type="text"
              placeholder={locale === 'ar' ? 'مثال: cpc, social, email' : 'e.g., cpc, social, email'}
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              className={result.missingParams.includes('medium') ? 'border-destructive' : ''}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'نوع الوسيط (مدفوع/عضوي)' : 'Marketing medium (paid/organic)'}
            </p>
          </div>

          {/* UTM Campaign - Required */}
          <div className="space-y-2">
            <Label htmlFor="campaign" className="flex items-center gap-1">
              {t("campaign")} *
              {result.missingParams.includes('campaign') && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </Label>
            <Input
              id="campaign"
              type="text"
              placeholder={locale === 'ar' ? 'مثال: summer_sale_2026' : 'e.g., summer_sale_2026'}
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              className={result.missingParams.includes('campaign') ? 'border-destructive' : ''}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'اسم الحملة' : 'Campaign name'}
            </p>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="term">{t("term")}</Label>
              <Input
                id="term"
                type="text"
                placeholder={locale === 'ar' ? 'كلمات مفتاحية' : 'Keywords'}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">{t("content")}</Label>
              <Input
                id="content"
                type="text"
                placeholder={locale === 'ar' ? 'محتوى الإعلان' : 'Ad content'}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing Parameters Warning - Requirement 2.3 */}
      {showMissingWarning && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  {locale === 'ar' ? 'حقول مطلوبة مفقودة' : 'Missing required fields'}
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  {locale === 'ar' 
                    ? `يرجى ملء: ${result.missingParams.map(p => t(p)).join('، ')}`
                    : `Please fill in: ${result.missingParams.join(', ')}`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {hasUrl && result.isValid && (
        <Card 
          className="border-green-500"
          role="region"
          aria-label={locale === "ar" ? "النتيجة" : "Result"}
          aria-live="polite"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" aria-hidden="true" />
              <span className="text-green-500">{t("generatedUrl")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Generated URL */}
            <div className="space-y-2">
              <Label>{t("fullUrl")}</Label>
              <div className="flex gap-2">
                <Input
                  value={result.fullUrl}
                  readOnly
                  className="font-mono text-sm"
                  dir="ltr"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  aria-label={locale === 'ar' ? 'نسخ الرابط' : 'Copy link'}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* URL Breakdown */}
            <div className="space-y-2">
              <Label>{t("breakdown")}</Label>
              <div className="p-4 rounded-lg bg-muted font-mono text-sm overflow-x-auto" dir="ltr">
                <div className="space-y-1">
                  <div><span className="text-muted-foreground">utm_source=</span>{source}</div>
                  <div><span className="text-muted-foreground">utm_medium=</span>{medium}</div>
                  <div><span className="text-muted-foreground">utm_campaign=</span>{campaign}</div>
                  {term && <div><span className="text-muted-foreground">utm_term=</span>{term}</div>}
                  {content && <div><span className="text-muted-foreground">utm_content=</span>{content}</div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {hasUrl && !result.isValid && result.error && result.missingParams.length === 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {result.error}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
