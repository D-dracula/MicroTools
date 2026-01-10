"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bot, Copy, Check, AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { validateRobotsTxt, type RobotsValidatorResult, type ValidationSeverity } from "@/lib/calculators/robots-validator";
import { ShareButtons } from "./shared/share-buttons";
import { SEOContent } from "./shared/seo-content";

const SAMPLE_ROBOTS = `User-agent: *
Disallow: /admin/
Disallow: /private/
Allow: /public/

User-agent: Googlebot
Allow: /

Sitemap: https://example.com/sitemap.xml`;

export function RobotsValidator() {
  const t = useTranslations("tools.robotsValidator");
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';
  
  const [content, setContent] = useState<string>("");
  const [justCopied, setJustCopied] = useState(false);
  
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Validate in real-time
  const result: RobotsValidatorResult | null = useMemo(() => {
    if (!content.trim()) return null;
    return validateRobotsTxt(content);
  }, [content]);

  const handleCopyResult = async () => {
    if (!result) return;
    
    const text = result.issues.map(i => 
      `Line ${i.line}: [${i.severity.toUpperCase()}] ${i.message}`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      setJustCopied(true);
      toast.success(isRTL ? 'تم النسخ!' : 'Copied!');
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error(isRTL ? 'فشل النسخ' : 'Failed to copy');
    }
  };

  const handleLoadSample = () => {
    setContent(SAMPLE_ROBOTS);
  };

  const getSeverityIcon = (severity: ValidationSeverity) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityClass = (severity: ValidationSeverity) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="robots-input">{t("enterContent")}</Label>
              <Button variant="ghost" size="sm" onClick={handleLoadSample}>
                {t("loadSample")}
              </Button>
            </div>
            <textarea
              id="robots-input"
              placeholder={isRTL 
                ? 'الصق محتوى robots.txt هنا...' 
                : 'Paste your robots.txt content here...'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[200px] p-4 rounded-md border border-input bg-background text-sm resize-y font-mono"
              dir="ltr"
            />
          </div>

          {/* Quick Reference */}
          <div className="p-3 rounded-md bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">{t("validDirectives")}:</p>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span>User-agent</span>
              <span>Disallow</span>
              <span>Allow</span>
              <span>Sitemap</span>
              <span>Crawl-delay</span>
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
                {result.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                {result.isValid ? t("valid") : t("invalid")}
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
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950">
                <div className="text-xl font-bold text-red-600">{result.summary.errorCount}</div>
                <div className="text-xs text-muted-foreground">{t("errors")}</div>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-950">
                <div className="text-xl font-bold text-yellow-600">{result.summary.warningCount}</div>
                <div className="text-xs text-muted-foreground">{t("warnings")}</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950">
                <div className="text-xl font-bold text-blue-600">{result.summary.infoCount}</div>
                <div className="text-xs text-muted-foreground">{t("info")}</div>
              </div>
            </div>

            {/* User Agents Found */}
            {result.userAgents.length > 0 && (
              <div className="p-3 rounded-md bg-muted/50">
                <p className="text-sm font-medium mb-2">{t("userAgentsFound")}:</p>
                <div className="flex flex-wrap gap-2">
                  {result.userAgents.map((ua, i) => (
                    <span key={i} className="px-2 py-1 text-xs rounded bg-primary/10 font-mono">
                      {ua}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sitemaps Found */}
            {result.sitemaps.length > 0 && (
              <div className="p-3 rounded-md bg-muted/50">
                <p className="text-sm font-medium mb-2">{t("sitemapsFound")}:</p>
                <div className="space-y-1">
                  {result.sitemaps.map((sm, i) => (
                    <p key={i} className="text-xs font-mono text-muted-foreground break-all">
                      {sm}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Issues List */}
            {result.issues.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("issues")}:</p>
                {result.issues.map((issue, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-md border ${getSeverityClass(issue.severity)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {issue.line > 0 && `${t("line")} ${issue.line}: `}
                          {issue.message}
                        </p>
                        {issue.suggestion && (
                          <p className="text-xs text-muted-foreground mt-1">
                            💡 {issue.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Share Buttons */}
            <ShareButtons
              copyText={result.issues.map(i => `Line ${i.line}: ${i.message}`).join('\n')}
            />
          </CardContent>
        </Card>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="robotsValidator" />
    </div>
  );
}
