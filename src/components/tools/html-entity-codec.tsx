"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Code, Copy, Check, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { processHtml, type CodecMode, type HtmlCodecResult } from "@/lib/calculators/html-entity-codec";
import { ShareButtons } from "./shared/share-buttons";
import { SEOContent } from "./shared/seo-content";

export function HtmlEntityCodec() {
  const t = useTranslations("tools.htmlEntityCodec");
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';
  
  const [text, setText] = useState<string>("");
  const [mode, setMode] = useState<CodecMode>("encode");
  const [justCopied, setJustCopied] = useState(false);
  
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Process text in real-time
  const result: HtmlCodecResult = useMemo(() => {
    return processHtml({ text, mode });
  }, [text, mode]);

  const handleCopyResult = async () => {
    if (!result.result) return;
    
    try {
      await navigator.clipboard.writeText(result.result);
      setJustCopied(true);
      toast.success(isRTL ? 'تم النسخ!' : 'Copied!');
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error(isRTL ? 'فشل النسخ' : 'Failed to copy');
    }
  };

  const handleSwapMode = () => {
    // Swap mode and use result as new input
    setMode(mode === 'encode' ? 'decode' : 'encode');
    if (result.result) {
      setText(result.result);
    }
  };

  const getCopyText = () => {
    return result.result;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selector */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'encode' ? 'default' : 'outline'}
              onClick={() => setMode('encode')}
              className="flex-1"
            >
              {t("encode")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwapMode}
              title={isRTL ? 'تبديل' : 'Swap'}
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={mode === 'decode' ? 'default' : 'outline'}
              onClick={() => setMode('decode')}
              className="flex-1"
            >
              {t("decode")}
            </Button>
          </div>

          {/* Input Text */}
          <div className="space-y-2">
            <Label htmlFor="text-input">
              {mode === 'encode' ? t("textToEncode") : t("textToDecode")}
            </Label>
            <textarea
              id="text-input"
              placeholder={mode === 'encode' 
                ? (isRTL ? 'أدخل النص لتشفيره (مثال: <div>Hello</div>)' : 'Enter text to encode (e.g., <div>Hello</div>)')
                : (isRTL ? 'أدخل النص لفك تشفيره (مثال: &lt;div&gt;Hello&lt;/div&gt;)' : 'Enter text to decode (e.g., &lt;div&gt;Hello&lt;/div&gt;)')
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[150px] p-4 rounded-md border border-input bg-background text-sm resize-y font-mono"
              dir="ltr"
            />
          </div>

          {/* Quick Reference */}
          <div className="p-3 rounded-md bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">{t("commonEntities")}:</p>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span>&amp; → &amp;amp;</span>
              <span>&lt; → &amp;lt;</span>
              <span>&gt; → &amp;gt;</span>
              <span>&quot; → &amp;quot;</span>
              <span>&apos; → &amp;#39;</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Section */}
      {text.trim() !== '' && (
        <Card ref={resultCardRef}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("result")}</span>
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
            <div 
              className="p-4 rounded-md bg-muted/50 min-h-[100px] whitespace-pre-wrap break-all font-mono text-sm"
              dir="ltr"
            >
              {result.result || (isRTL ? 'النتيجة ستظهر هنا...' : 'Result will appear here...')}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xl font-bold text-primary">{result.originalLength}</div>
                <div className="text-xs text-muted-foreground">{t("originalLength")}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xl font-bold text-primary">{result.resultLength}</div>
                <div className="text-xs text-muted-foreground">{t("resultLength")}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-xl font-bold text-primary">{result.entitiesProcessed}</div>
                <div className="text-xs text-muted-foreground">{t("entitiesProcessed")}</div>
              </div>
            </div>

            {/* Share Buttons */}
            <ShareButtons
              copyText={getCopyText()}
            />
          </CardContent>
        </Card>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="htmlEntityCodec" />
    </div>
  );
}
