"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Scissors, Copy, Check, ExternalLink, Link2 } from "lucide-react";
import {
  createShortLink,
  extractDomain,
  formatUrlForDisplay,
  type ShortenResult,
} from "@/lib/calculators/link-shortener";
import { toast } from "sonner";

export function LinkShortener() {
  const t = useTranslations("tools.linkShortener");
  const locale = useLocale();
  
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [customAlias, setCustomAlias] = useState<string>("");
  const [influencerName, setInfluencerName] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Generate shortened link in real-time
  const result: ShortenResult = useMemo(() => {
    if (!originalUrl.trim()) {
      return { shortUrl: '', shortCode: '', originalUrl: '', isValid: false };
    }
    
    return createShortLink({
      originalUrl,
      customAlias: customAlias || undefined,
      influencerName: influencerName || undefined,
    });
  }, [originalUrl, customAlias, influencerName]);

  // Extract domain for preview - Requirement 4.5
  const destinationDomain = useMemo(() => {
    if (!result.isValid || !result.originalUrl) return '';
    return extractDomain(result.originalUrl);
  }, [result]);

  // Copy to clipboard handler - Requirement 4.4
  const handleCopy = useCallback(async () => {
    if (!result.isValid || !result.shortUrl) return;
    
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      toast.success(locale === 'ar' ? 'تم نسخ الرابط' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(locale === 'ar' ? 'فشل النسخ' : 'Failed to copy');
    }
  }, [result, locale]);

  // Open original URL
  const handleOpenOriginal = useCallback(() => {
    if (!result.isValid || !result.originalUrl) return;
    window.open(result.originalUrl, '_blank');
  }, [result]);

  const hasValidInput = originalUrl.trim() !== '';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Original URL - Requirement 4.1 */}
          <div className="space-y-2">
            <Label htmlFor="originalUrl">{t("originalUrl")} *</Label>
            <Input
              id="originalUrl"
              type="url"
              placeholder={locale === 'ar' ? 'https://example.com/long-url' : 'https://example.com/long-url'}
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="text-lg font-mono"
              dir="ltr"
            />
          </div>

          {/* Influencer Name */}
          <div className="space-y-2">
            <Label htmlFor="influencerName">{t("influencerName")}</Label>
            <Input
              id="influencerName"
              type="text"
              placeholder={locale === 'ar' ? 'اسم المؤثر (اختياري)' : 'Influencer name (optional)'}
              value={influencerName}
              onChange={(e) => setInfluencerName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' 
                ? 'سيتم استخدام الاسم لإنشاء رابط مخصص للمؤثر'
                : 'The name will be used to create a custom link for the influencer'}
            </p>
          </div>

          {/* Custom Alias - Requirement 4.2 */}
          <div className="space-y-2">
            <Label htmlFor="customAlias">{t("customAlias")}</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">mtools.link/</span>
              <Input
                id="customAlias"
                type="text"
                placeholder={locale === 'ar' ? 'رابط-مخصص' : 'custom-alias'}
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                className="flex-1 font-mono"
                dir="ltr"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' 
                ? 'اترك فارغاً لإنشاء رابط تلقائي'
                : 'Leave empty for auto-generated link'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {hasValidInput && (
        <Card 
          className={result.isValid ? "border-primary" : "border-destructive"}
          role="region"
          aria-label={locale === "ar" ? "النتيجة" : "Result"}
          aria-live="polite"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.isValid ? (
                <>
                  <Link2 className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-primary">{t("shortenedLink")}</span>
                </>
              ) : (
                <span className="text-destructive">{t("error")}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.isValid ? (
              <>
                {/* Shortened Link with Copy Button - Requirement 4.4 */}
                <div className="space-y-2">
                  <Label>{t("shortUrl")}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={result.shortUrl}
                      readOnly
                      className="font-mono text-lg"
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

                {/* Destination Preview - Requirement 4.5 */}
                <div className="space-y-2">
                  <Label>{t("destination")}</Label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{destinationDomain}</p>
                      <p className="text-xs text-muted-foreground truncate" dir="ltr">
                        {formatUrlForDisplay(result.originalUrl, 60)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenOriginal}
                      aria-label={locale === 'ar' ? 'فتح الرابط الأصلي' : 'Open original link'}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Short Code Info */}
                <div className="space-y-2">
                  <Label>{t("shortCode")}</Label>
                  <div className="p-3 rounded-lg bg-muted">
                    <code className="text-sm font-mono">{result.shortCode}</code>
                  </div>
                </div>

                {/* Usage Note */}
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                  <p className="text-sm">
                    {locale === 'ar' 
                      ? '💡 ملاحظة: هذا الرابط للعرض فقط. في الإنتاج، سيتم حفظ الروابط في قاعدة البيانات وتتبع النقرات.'
                      : '💡 Note: This link is for demonstration. In production, links would be saved to database and clicks tracked.'}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-destructive">{result.error}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Message */}
      {!hasValidInput && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterUrl")}
        </p>
      )}
    </div>
  );
}
