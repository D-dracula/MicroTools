"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Type, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { convertCase, type CaseType, type CaseConvertResult } from "@/lib/calculators/case-converter";
import { ShareButtons } from "./shared/share-buttons";
import { SEOContent } from "./shared/seo-content";

export function CaseConverter() {
  const t = useTranslations("tools.caseConverter");
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';
  
  const [text, setText] = useState<string>("");
  const [caseType, setCaseType] = useState<CaseType>("uppercase");
  const [justCopied, setJustCopied] = useState(false);
  
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Convert text in real-time
  const result: CaseConvertResult = useMemo(() => {
    return convertCase({ text, caseType });
  }, [text, caseType]);

  const caseTypes: { type: CaseType; label: string; example: string }[] = [
    { type: 'uppercase', label: t('uppercase'), example: 'UPPERCASE' },
    { type: 'lowercase', label: t('lowercase'), example: 'lowercase' },
    { type: 'titlecase', label: t('titlecase'), example: 'Title Case' },
    { type: 'sentencecase', label: t('sentencecase'), example: 'Sentence case' },
    { type: 'togglecase', label: t('togglecase'), example: 'tOGGLE cASE' },
  ];

  const handleCopyResult = async () => {
    if (!result.convertedText) return;
    
    try {
      await navigator.clipboard.writeText(result.convertedText);
      setJustCopied(true);
      toast.success(isRTL ? 'تم النسخ!' : 'Copied!');
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error(isRTL ? 'فشل النسخ' : 'Failed to copy');
    }
  };

  const getCopyText = () => {
    const label = caseTypes.find(c => c.type === caseType)?.label || caseType;
    return `${label}:\n${result.convertedText}`;
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
              {t("enterText")}
            </Label>
            <textarea
              id="text-input"
              placeholder={isRTL 
                ? 'أدخل النص هنا...'
                : 'Enter your text here...'
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[150px] p-4 rounded-md border border-input bg-background text-sm resize-y"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Case Type Selector */}
          <div className="space-y-2">
            <Label>{t("selectCase")}</Label>
            <div className="flex flex-wrap gap-2">
              {caseTypes.map(({ type, label, example }) => (
                <Button
                  key={type}
                  variant={caseType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCaseType(type)}
                  className="flex-1 min-w-[120px]"
                >
                  <span className="truncate">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Section */}
      {text.trim() !== '' && (
        <Card ref={resultCardRef}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("convertedText")}</span>
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
              className="p-4 rounded-md bg-muted/50 min-h-[100px] whitespace-pre-wrap break-words"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {result.convertedText || (isRTL ? 'النتيجة ستظهر هنا...' : 'Result will appear here...')}
            </div>

            {/* Statistics */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>
                {isRTL ? `الطول الأصلي: ${result.originalLength}` : `Original: ${result.originalLength} chars`}
              </span>
              <span>
                {isRTL ? `الطول بعد التحويل: ${result.convertedLength}` : `Converted: ${result.convertedLength} chars`}
              </span>
            </div>

            {/* Share Buttons */}
            <ShareButtons
              copyText={getCopyText()}
            />
          </CardContent>
        </Card>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="caseConverter" />
    </div>
  );
}
