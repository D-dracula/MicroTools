"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCode, Copy, Check, Download, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { 
  generateSitemap, 
  parseUrlsFromText,
  type SitemapUrl, 
  type ChangeFrequency,
  type SitemapGeneratorResult 
} from "@/lib/calculators/sitemap-generator";
import { ShareButtons } from "./shared/share-buttons";
import { SEOContent } from "./shared/seo-content";

const CHANGE_FREQUENCIES: ChangeFrequency[] = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

export function SitemapGenerator() {
  const t = useTranslations("tools.sitemapGenerator");
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';
  
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [urlText, setUrlText] = useState<string>("");
  const [urls, setUrls] = useState<SitemapUrl[]>([{ loc: '', priority: 0.5, changefreq: 'weekly' }]);
  const [autoLastmod, setAutoLastmod] = useState(true);
  const [justCopied, setJustCopied] = useState(false);
  
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Generate sitemap
  const result: SitemapGeneratorResult | null = useMemo(() => {
    if (mode === 'simple') {
      const parsedUrls = parseUrlsFromText(urlText);
      if (parsedUrls.length === 0) return null;
      return generateSitemap({
        urls: parsedUrls.map(loc => ({ loc, priority: 0.5, changefreq: 'weekly' as ChangeFrequency })),
        autoLastmod,
      });
    } else {
      const validUrls = urls.filter(u => u.loc.trim());
      if (validUrls.length === 0) return null;
      return generateSitemap({ urls: validUrls, autoLastmod });
    }
  }, [mode, urlText, urls, autoLastmod]);

  const handleCopyResult = async () => {
    if (!result?.xml) return;
    
    try {
      await navigator.clipboard.writeText(result.xml);
      setJustCopied(true);
      toast.success(isRTL ? 'تم النسخ!' : 'Copied!');
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error(isRTL ? 'فشل النسخ' : 'Failed to copy');
    }
  };

  const handleDownload = () => {
    if (!result?.xml) return;
    
    const blob = new Blob([result.xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(isRTL ? 'تم التحميل!' : 'Downloaded!');
  };

  const addUrl = () => {
    setUrls([...urls, { loc: '', priority: 0.5, changefreq: 'weekly' }]);
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const updateUrl = (index: number, field: keyof SitemapUrl, value: string | number) => {
    const newUrls = [...urls];
    newUrls[index] = { ...newUrls[index], [field]: value };
    setUrls(newUrls);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selector */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'simple' ? 'default' : 'outline'}
              onClick={() => setMode('simple')}
              className="flex-1"
            >
              {t("simpleMode")}
            </Button>
            <Button
              variant={mode === 'advanced' ? 'default' : 'outline'}
              onClick={() => setMode('advanced')}
              className="flex-1"
            >
              {t("advancedMode")}
            </Button>
          </div>

          {mode === 'simple' ? (
            /* Simple Mode - URLs only */
            <div className="space-y-2">
              <Label htmlFor="urls-input">{t("enterUrls")}</Label>
              <textarea
                id="urls-input"
                placeholder={isRTL 
                  ? 'أدخل الروابط (رابط واحد في كل سطر):\nhttps://example.com/\nhttps://example.com/about' 
                  : 'Enter URLs (one per line):\nhttps://example.com/\nhttps://example.com/about'
                }
                value={urlText}
                onChange={(e) => setUrlText(e.target.value)}
                className="w-full min-h-[150px] p-4 rounded-md border border-input bg-background text-sm resize-y font-mono"
                dir="ltr"
              />
            </div>
          ) : (
            /* Advanced Mode - Full control */
            <div className="space-y-4">
              {urls.map((url, index) => (
                <div key={index} className="p-4 rounded-lg border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">URL {index + 1}</span>
                    {urls.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUrl(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  
                  <Input
                    placeholder="https://example.com/page"
                    value={url.loc}
                    onChange={(e) => updateUrl(index, 'loc', e.target.value)}
                    dir="ltr"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("priority")}</Label>
                      <Select
                        value={String(url.priority || 0.5)}
                        onValueChange={(v) => updateUrl(index, 'priority', parseFloat(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0].map(p => (
                            <SelectItem key={p} value={String(p)}>{p.toFixed(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">{t("changeFreq")}</Label>
                      <Select
                        value={url.changefreq || 'weekly'}
                        onValueChange={(v) => updateUrl(index, 'changefreq', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANGE_FREQUENCIES.map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" onClick={addUrl} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                {t("addUrl")}
              </Button>
            </div>
          )}

          {/* Auto Lastmod Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-lastmod"
              checked={autoLastmod}
              onChange={(e) => setAutoLastmod(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="auto-lastmod" className="text-sm cursor-pointer">
              {t("autoLastmod")}
            </Label>
          </div>

          {/* Info */}
          <div className="p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
            {t("maxUrls")}
          </div>
        </CardContent>
      </Card>

      {/* Result Section */}
      {result && (
        <Card ref={resultCardRef}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("generatedSitemap")}</span>
              <div className="flex gap-2">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isRTL ? 'تحميل' : 'Download'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="space-y-2">
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded bg-red-50 dark:bg-red-950 text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <span>{err.url ? `${err.url}: ` : ''}{err.error}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-4 text-center">
              <div className="flex-1 p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{result.urlCount}</div>
                <div className="text-xs text-muted-foreground">{t("urlsIncluded")}</div>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">
                  {(result.xml.length / 1024).toFixed(1)} KB
                </div>
                <div className="text-xs text-muted-foreground">{t("fileSize")}</div>
              </div>
            </div>

            {/* XML Preview */}
            <div className="space-y-2">
              <Label>{t("xmlPreview")}</Label>
              <pre className="p-4 rounded-md bg-muted/50 overflow-x-auto text-xs font-mono max-h-[300px] overflow-y-auto" dir="ltr">
                {result.xml}
              </pre>
            </div>

            {/* Share Buttons */}
            <ShareButtons
              copyText={result.xml}
            />
          </CardContent>
        </Card>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="sitemapGenerator" />
    </div>
  );
}
