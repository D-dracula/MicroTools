"use client";

import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Copy, Check, Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { 
  checkResponse, 
  type ResponseCheckResult,
  type ResponseStatus 
} from "@/lib/calculators/response-checker";
import { ShareButtons } from "./shared/share-buttons";
import { SEOContent } from "./shared/seo-content";

export function ResponseChecker() {
  const t = useTranslations("tools.responseChecker");
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';
  
  const [url, setUrl] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ResponseCheckResult | null>(null);
  const [justCopied, setJustCopied] = useState(false);
  
  const resultCardRef = useRef<HTMLDivElement>(null);

  const handleCheck = async () => {
    if (!url.trim()) {
      toast.error(isRTL ? 'أدخل رابط الموقع' : 'Enter a URL');
      return;
    }
    
    setIsChecking(true);
    setResult(null);
    
    try {
      const checkResult = await checkResponse({ url, timeout: 10000 });
      setResult(checkResult);
    } catch {
      toast.error(isRTL ? 'حدث خطأ أثناء الفحص' : 'Error during check');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopyResult = async () => {
    if (!result) return;
    
    const text = `URL: ${result.url}\nResponse Time: ${result.responseTime}ms\nStatus: ${result.status}\nAccessible: ${result.isAccessible ? 'Yes' : 'No'}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setJustCopied(true);
      toast.success(isRTL ? 'تم النسخ!' : 'Copied!');
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error(isRTL ? 'فشل النسخ' : 'Failed to copy');
    }
  };

  const getStatusIcon = (status: ResponseStatus) => {
    switch (status) {
      case 'fast':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'moderate':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'slow':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      case 'timeout':
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getStatusColor = (status: ResponseStatus) => {
    switch (status) {
      case 'fast':
        return 'text-green-600 bg-green-100 dark:bg-green-950';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950';
      case 'slow':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-950';
      case 'timeout':
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-950';
    }
  };

  const getStatusText = (status: ResponseStatus) => {
    switch (status) {
      case 'fast':
        return t("statusFast");
      case 'moderate':
        return t("statusModerate");
      case 'slow':
        return t("statusSlow");
      case 'timeout':
        return t("statusTimeout");
      case 'error':
        return t("statusError");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url-input">{t("enterUrl")}</Label>
            <div className="flex gap-2">
              <Input
                id="url-input"
                placeholder="example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                dir="ltr"
                className="flex-1"
              />
              <Button 
                onClick={handleCheck} 
                disabled={isChecking}
                className="min-w-[100px]"
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("check")
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("urlHint")}
            </p>
          </div>

          {/* Info */}
          <div className="p-3 rounded-md bg-muted/50">
            <p className="text-xs text-muted-foreground">{t("responseInfo")}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {t("fast")} (&lt;500ms)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                {t("moderate")} (500-2000ms)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                {t("slow")} (&gt;2000ms)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Section */}
      {result && (
        <Card ref={resultCardRef}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(result.status)}
                {getStatusText(result.status)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyResult}
                className="gap-2"
              >
                {justCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {isRTL ? 'نسخ' : 'Copy'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* URL */}
            <div className="p-3 rounded-md bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">{t("checkedUrl")}</p>
              <p className="font-mono text-sm break-all" dir="ltr">{result.url}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg text-center ${getStatusColor(result.status)}`}>
                <div className="text-3xl font-bold">{result.responseTime}</div>
                <div className="text-xs opacity-80">ms</div>
                <div className="text-sm mt-1">{t("responseTime")}</div>
              </div>
              <div className={`p-4 rounded-lg text-center ${result.isAccessible ? 'text-green-600 bg-green-100 dark:bg-green-950' : 'text-red-600 bg-red-100 dark:bg-red-950'}`}>
                <div className="text-3xl font-bold">
                  {result.isAccessible ? '✓' : '✗'}
                </div>
                <div className="text-sm mt-1">
                  {result.isAccessible ? t("accessible") : t("notAccessible")}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {result.error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-600">{result.error}</p>
              </div>
            )}

            {/* Recommendations */}
            {result.status === 'slow' && (
              <div className="p-3 rounded-md bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">
                  {t("slowRecommendation")}
                </p>
                <ul className="text-xs text-orange-600 dark:text-orange-500 list-disc list-inside space-y-1">
                  <li>{t("tip1")}</li>
                  <li>{t("tip2")}</li>
                  <li>{t("tip3")}</li>
                </ul>
              </div>
            )}

            {/* Share Buttons */}
            <ShareButtons
              copyText={`URL: ${result.url}\nResponse Time: ${result.responseTime}ms\nStatus: ${result.status}`}
            />
          </CardContent>
        </Card>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="responseChecker" />
    </div>
  );
}
