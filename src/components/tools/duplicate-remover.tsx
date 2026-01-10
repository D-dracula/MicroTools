"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ListX, Copy, Check, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { removeDuplicateLines, type DuplicateRemoverResult } from "@/lib/calculators/duplicate-remover";
import { ShareButtons } from "./shared/share-buttons";
import { SEOContent } from "./shared/seo-content";

export function DuplicateRemover() {
  const t = useTranslations("tools.duplicateRemover");
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';
  
  const [text, setText] = useState<string>("");
  const [caseSensitive, setCaseSensitive] = useState<boolean>(true);
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(false);
  const [justCopied, setJustCopied] = useState(false);
  
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Process text in real-time
  const result: DuplicateRemoverResult = useMemo(() => {
    return removeDuplicateLines({ text, caseSensitive, trimWhitespace });
  }, [text, caseSensitive, trimWhitespace]);

  const handleCopyResult = async () => {
    if (!result.cleanedText) return;
    
    try {
      await navigator.clipboard.writeText(result.cleanedText);
      setJustCopied(true);
      toast.success(isRTL ? 'تم النسخ!' : 'Copied!');
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error(isRTL ? 'فشل النسخ' : 'Failed to copy');
    }
  };

  const handleClear = () => {
    setText("");
  };

  const getCopyText = () => {
    return `${t("title")}:\n${result.cleanedText}\n\n${isRTL ? 'السطور الأصلية' : 'Original lines'}: ${result.originalLineCount}\n${isRTL ? 'السطور الفريدة' : 'Unique lines'}: ${result.uniqueLineCount}\n${isRTL ? 'المكررات المحذوفة' : 'Duplicates removed'}: ${result.duplicatesRemoved}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListX className="h-5 w-5" aria-hidden="true" />
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
              placeholder={isRTL 
                ? 'أدخل النص هنا (سطر واحد لكل عنصر)...'
                : 'Enter your text here (one item per line)...'
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[200px] p-4 rounded-md border border-input bg-background text-sm resize-y font-mono"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="case-sensitive"
                checked={caseSensitive}
                onCheckedChange={setCaseSensitive}
              />
              <Label htmlFor="case-sensitive" className="cursor-pointer">
                {t("caseSensitive")}
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="trim-whitespace"
                checked={trimWhitespace}
                onCheckedChange={setTrimWhitespace}
              />
              <Label htmlFor="trim-whitespace" className="cursor-pointer">
                {t("trimWhitespace")}
              </Label>
            </div>
          </div>

          {/* Clear Button */}
          {text && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isRTL ? 'مسح' : 'Clear'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Statistics Section */}
      {text.trim() !== '' && (
        <Card>
          <CardHeader>
            <CardTitle>{t("statistics")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-3xl font-bold text-primary">{result.originalLineCount}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t("originalLines")}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{result.uniqueLineCount}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t("uniqueLines")}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{result.duplicatesRemoved}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t("duplicatesRemoved")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result Section */}
      {text.trim() !== '' && (
        <Card ref={resultCardRef}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("cleanedText")}</span>
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
              className="p-4 rounded-md bg-muted/50 min-h-[150px] whitespace-pre-wrap break-words font-mono text-sm"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {result.cleanedText || (isRTL ? 'النتيجة ستظهر هنا...' : 'Result will appear here...')}
            </div>

            {/* Share Buttons */}
            <ShareButtons
              copyText={getCopyText()}
            />
          </CardContent>
        </Card>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="duplicateRemover" />
    </div>
  );
}
